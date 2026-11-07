import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { REQUEST_STATES } from '../../service/time-off-request.criteria';
import { TimeOffStatus } from '../../service/time-off-type';
import { TimeOffTypeSchema } from './create-time-off-request.request';

export const ManagedTimeOffRequestFilterQuerySchema = z.object({
  /** PENDING — waiting for a decision; CLOSED — everything else. */
  state: z.enum(REQUEST_STATES, { error: 'validation.invalid' }).default('PENDING'),
  /** Closed list only: narrow to one closed status. */
  status: z
    .enum([TimeOffStatus.APPROVED, TimeOffStatus.REJECTED, TimeOffStatus.CANCELED], {
      error: 'validation.invalid',
    })
    .optional(),
  type: TimeOffTypeSchema.optional(),
  /** `true` — only requests the caller may decide. */
  mine: z
    .enum(['true', 'false'], { error: 'validation.invalid' })
    .optional()
    .transform((value) => value === 'true'),
  /** Words matched against the employee's first and last name. */
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});

export class ManagedTimeOffRequestFilterQuery extends createZodDto(
  ManagedTimeOffRequestFilterQuerySchema,
) {}
