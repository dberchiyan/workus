import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageResponseSchema } from '../../../../common/dto/page.response';
import { TIME_OFF_STATUSES } from '../../service/time-off-type';
import { TimeOffTypeSchema } from './create-time-off-request.request';

export const TimeOffStatusSchema = z.enum(TIME_OFF_STATUSES).meta({ id: 'TimeOffStatus' });

const PersonSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  /** Null for admins (no employee record). */
  positionTitle: z.string().nullable(),
});

export class LeaveBalancesResponse extends createZodDto(
  z.object({
    content: z.array(
      z.object({
        type: TimeOffTypeSchema,
        cycleStart: z.iso.date(),
        /** Last day of the cycle (inclusive). */
        cycleEnd: z.iso.date(),
        /** Working days per cycle; null = no limit. */
        allowance: z.number().int().nullable(),
        used: z.number().int(),
        pending: z.number().int(),
        /** allowance − used − pending; null without a limit. */
        available: z.number().int().nullable(),
      }),
    ),
  }),
) {}

export const TimeOffRequestSchema = z
  .object({
    id: z.uuid(),
    type: TimeOffTypeSchema,
    startDate: z.iso.date(),
    /** Inclusive. */
    endDate: z.iso.date(),
    /** Working days. */
    days: z.number().int(),
    status: TimeOffStatusSchema,
    note: z.string().nullable(),
    decisionComment: z.string().nullable(),
    createdAt: z.iso.datetime(),
    decidedAt: z.iso.datetime().nullable(),
    decidedBy: PersonSchema.nullable(),
    /** Who may decide (the employee's responsible people when it was made). */
    responsibles: z.array(PersonSchema),
    /** Oldest first. */
    history: z.array(
      z.object({
        id: z.uuid(),
        action: z.enum(['CREATED', 'APPROVED', 'REJECTED', 'CANCELED']),
        occurredAt: z.iso.datetime(),
        /** Null = the system. */
        actor: PersonSchema.nullable(),
      }),
    ),
    canCancel: z.boolean(),
  })
  .meta({ id: 'TimeOffRequest' });

export class TimeOffRequestPageResponse extends createZodDto(
  pageResponseSchema(TimeOffRequestSchema),
) {}

export class TimeOffRequestResponse extends createZodDto(z.object(TimeOffRequestSchema.shape)) {}
