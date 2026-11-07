import { z } from 'zod';
import { TIME_OFF_TYPES } from './types';

/** Mirrors backend CreateTimeOffRequestRequest (time-off/controller/dto). */
export const TIME_OFF_LIMITS = { note: 500, periodDays: 60, comment: 1000 } as const;

const MESSAGES = {
  typeRequired: 'validation:timeOffType.required',
  startRequired: 'validation:period.start',
  endRequired: 'validation:period.end',
  order: 'validation:period.order',
  tooLong: 'validation:period.tooLong',
  noteTooLong: 'validation:note.tooLong',
  commentRequired: 'validation:timeOffComment.required',
  commentTooLong: 'validation:timeOffComment.tooLong',
} as const;

export type TimeOffValidationMessage = (typeof MESSAGES)[keyof typeof MESSAGES];
const MESSAGE_SET: ReadonlySet<string> = new Set(Object.values(MESSAGES));
export const isTimeOffValidationMessage = (message: string): message is TimeOffValidationMessage =>
  MESSAGE_SET.has(message);

const DAY_MS = 86_400_000;

export const createTimeOffSchema = z
  .object({
    type: z.enum(TIME_OFF_TYPES, { error: MESSAGES.typeRequired }),
    startDate: z.iso.date(MESSAGES.startRequired),
    endDate: z.iso.date(MESSAGES.endRequired),
    note: z.string().trim().max(TIME_OFF_LIMITS.note, MESSAGES.noteTooLong),
  })
  .superRefine((values, context) => {
    const days =
      (Date.parse(`${values.endDate}T00:00:00Z`) - Date.parse(`${values.startDate}T00:00:00Z`)) /
        DAY_MS +
      1;
    if (days < 1) {
      context.addIssue({ code: 'custom', path: ['endDate'], message: MESSAGES.order });
    } else if (days > TIME_OFF_LIMITS.periodDays) {
      context.addIssue({ code: 'custom', path: ['endDate'], message: MESSAGES.tooLong });
    }
  });

export type CreateTimeOffFormValues = z.input<typeof createTimeOffSchema>;
export type CreateTimeOffFormOutput = z.output<typeof createTimeOffSchema>;

/** Mirrors backend AddTimeOffCommentRequest. */
export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, MESSAGES.commentRequired)
    .max(TIME_OFF_LIMITS.comment, MESSAGES.commentTooLong),
});
export type CommentFormValues = z.input<typeof commentSchema>;
export type CommentFormOutput = z.output<typeof commentSchema>;
