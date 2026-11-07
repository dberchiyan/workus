import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isTimeOffType, TIME_OFF_TYPES, type TimeOffType } from '../../service/time-off-type';

export const TimeOffCalendarQuerySchema = z.object({
  /** The month shown, `YYYY-MM`. */
  month: z
    .string({ error: 'validation.invalid' })
    .regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, 'validation.invalid'),
  /** Comma-separated request types to show; absent → all of them. */
  types: z
    .string()
    .optional()
    .transform((value, context): TimeOffType[] => {
      if (value === undefined) {
        return [...TIME_OFF_TYPES];
      }
      const types = value.split(',').filter((type) => type.length > 0);
      if (!types.every(isTimeOffType)) {
        context.addIssue({ code: 'custom', message: 'validation.invalid' });
        return z.NEVER;
      }
      return [...new Set(types)];
    }),
  /** Words matched against the person's first name, last name or email. */
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});

export class TimeOffCalendarQuery extends createZodDto(TimeOffCalendarQuerySchema) {}
