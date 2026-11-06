import { z } from 'zod';
import { FEEDBACK_MAX_TEXT, isRichTextDoc, richTextLength } from './richText';
import type { RichTextDoc } from './types';

/** Mirrors backend CreateReviewRequestSchema (review/controller/dto/create-review.request.ts). */
export const REVIEW_LIMITS = { title: 150, feedback: 2000, responsibles: 10 } as const;

const MESSAGES = {
  titleRequired: 'validation:title.required',
  titleTooLong: 'validation:title.tooLong',
  dateInvalid: 'validation:reviewDate.invalid',
  statusRequired: 'validation:reviewStatus.required',
  salaryInvalid: 'validation:salary.invalid',
  salaryRequired: 'validation:salary.requiredForCompleted',
  responsiblesRequired: 'validation:responsibles.required',
  responsiblesTooMany: 'validation:responsibles.tooMany',
  feedbackTooLong: 'validation:feedback.textTooLong',
} as const;

export type ReviewValidationMessage = (typeof MESSAGES)[keyof typeof MESSAGES];
const MESSAGE_SET: ReadonlySet<string> = new Set(Object.values(MESSAGES));
export const isReviewValidationMessage = (message: string): message is ReviewValidationMessage =>
  MESSAGE_SET.has(message);

/** Monthly USD: a decimal string with up to two places — never a number (data.md → Money). */
const SALARY_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** Rich text (TipTap JSON) or null; ≤ 2000 characters of text, like the server. */
const feedback = z
  .custom<RichTextDoc | null>((value) => value === null || isRichTextDoc(value))
  .refine(
    (value) => value === null || richTextLength(value) <= FEEDBACK_MAX_TEXT,
    MESSAGES.feedbackTooLong,
  );

export const REVIEW_STATUSES = ['COMPLETED', 'SCHEDULED', 'CANCELED'] as const;

export const createReviewSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, MESSAGES.titleRequired)
      .max(REVIEW_LIMITS.title, MESSAGES.titleTooLong),
    date: z.iso.date(MESSAGES.dateInvalid),
    status: z
      .union([z.enum(REVIEW_STATUSES), z.literal('')])
      .refine((value) => value !== '', MESSAGES.statusRequired),
    salary: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (SALARY_PATTERN.test(value) && /[1-9]/.test(value)),
        MESSAGES.salaryInvalid,
      ),
    responsibleUserIds: z
      .array(z.uuid())
      .min(1, MESSAGES.responsiblesRequired)
      .max(REVIEW_LIMITS.responsibles, MESSAGES.responsiblesTooMany),
    feedbackHr: feedback,
    feedbackTeamLead: feedback,
    feedbackTeam: feedback,
    feedbackClient: feedback,
  })
  .superRefine((review, context) => {
    if (review.status === 'COMPLETED' && review.salary === '') {
      context.addIssue({ code: 'custom', path: ['salary'], message: MESSAGES.salaryRequired });
    }
  });

export type CreateReviewFormValues = z.input<typeof createReviewSchema>;
export type CreateReviewFormOutput = z.output<typeof createReviewSchema>;
