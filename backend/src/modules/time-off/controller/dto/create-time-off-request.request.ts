import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TIME_OFF_TYPES } from '../../service/time-off-type';

export const NOTE_MAX_LENGTH = 500;
/** Calendar days one request may cover. */
export const MAX_PERIOD_DAYS = 60;
const DAY_MS = 86_400_000;

export const TimeOffTypeSchema = z
  .enum(TIME_OFF_TYPES, { error: 'validation.timeOffType.required' })
  .meta({ id: 'TimeOffType' });

export class CreateTimeOffRequestRequest extends createZodDto(
  z
    .object({
      type: TimeOffTypeSchema,
      startDate: z.iso.date('validation.period.start'),
      /** Inclusive. */
      endDate: z.iso.date('validation.period.end'),
      /** Blank → none. */
      note: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.string().trim().max(NOTE_MAX_LENGTH, 'validation.note.tooLong').optional(),
      ),
    })
    .superRefine((request, context) => {
      const days =
        (Date.parse(`${request.endDate}T00:00:00Z`) -
          Date.parse(`${request.startDate}T00:00:00Z`)) /
          DAY_MS +
        1;
      if (days < 1) {
        context.addIssue({ code: 'custom', path: ['endDate'], message: 'validation.period.order' });
      } else if (days > MAX_PERIOD_DAYS) {
        context.addIssue({
          code: 'too_big',
          origin: 'number',
          maximum: MAX_PERIOD_DAYS,
          inclusive: true,
          path: ['endDate'],
          message: 'validation.period.tooLong',
        });
      }
    }),
) {}
