import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageResponseSchema } from '../../../../common/dto/page.response';
import { TIME_OFF_STATUSES } from '../../service/time-off-type';
import { TimeOffTypeSchema } from './create-time-off-request.request';

export const TimeOffStatusSchema = z.enum(TIME_OFF_STATUSES).meta({ id: 'TimeOffStatus' });

export const PersonSchema = z.object({
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

export const TimeOffCommentSchema = z
  .object({
    id: z.uuid(),
    body: z.string(),
    createdAt: z.iso.datetime(),
    /** Null until its author edits it. */
    editedAt: z.iso.datetime().nullable(),
    /** Only the author edits or deletes it. */
    author: PersonSchema,
  })
  .meta({ id: 'TimeOffComment' });

/** What every view of a request shows. */
const requestShape = {
  id: z.uuid(),
  type: TimeOffTypeSchema,
  startDate: z.iso.date(),
  /** Inclusive. */
  endDate: z.iso.date(),
  /** Working days. */
  days: z.number().int(),
  status: TimeOffStatusSchema,
  note: z.string().max(500).nullable(),
  decisionComment: z.string().max(500).nullable(),
  createdAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
  decidedBy: PersonSchema.nullable(),
  /** Who may decide (the employee's responsible people when it was made). */
  responsibles: z.array(PersonSchema),
  /** Oldest first. */
  history: z.array(
    z.object({
      id: z.uuid(),
      /** RESPONSIBLES_CHANGED — an admin changed who decides it. */
      action: z.enum(['CREATED', 'APPROVED', 'REJECTED', 'CANCELED', 'RESPONSIBLES_CHANGED']),
      occurredAt: z.iso.datetime(),
      /** Null = the system. */
      actor: PersonSchema.nullable(),
    }),
  ),
  /** Comments (admins and the employee), oldest first — the latest 50 when there are more (see commentCount). */
  comments: z.array(TimeOffCommentSchema),
  commentCount: z.number().int(),
};

export const TimeOffRequestSchema = z
  .object({ ...requestShape, canCancel: z.boolean() })
  .meta({ id: 'TimeOffRequest' });

/** A request as an admin sees it: whose it is and what the viewer may do with it. */
export const ManagedTimeOffRequestSchema = z
  .object({
    ...requestShape,
    employee: z.object({
      id: z.uuid(),
      /** For the avatar colour. */
      userId: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      positionTitle: z.string(),
    }),
    /** Only the request's responsible people decide; each action only from its statuses. */
    can: z.object({ approve: z.boolean(), reject: z.boolean(), cancel: z.boolean() }),
  })
  .meta({ id: 'ManagedTimeOffRequest' });

export class ManagedTimeOffRequestPageResponse extends createZodDto(
  pageResponseSchema(ManagedTimeOffRequestSchema),
) {}

export class ManagedTimeOffRequestResponse extends createZodDto(
  z.object(ManagedTimeOffRequestSchema.shape),
) {}

export class TimeOffCommentResponse extends createZodDto(z.object(TimeOffCommentSchema.shape)) {}

export class TimeOffRequestPageResponse extends createZodDto(
  pageResponseSchema(TimeOffRequestSchema),
) {}

export class TimeOffRequestResponse extends createZodDto(z.object(TimeOffRequestSchema.shape)) {}

export const TimeOffCalendarRowSchema = z
  .object({
    employee: z.object({
      id: z.uuid(),
      /** For the avatar colour. */
      userId: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      positionTitle: z.string(),
      startDate: z.iso.date(),
      /** First day without work; null while employed. */
      terminatedOn: z.iso.date().nullable(),
    }),
    /** Approved and pending requests touching the month, by start date. */
    requests: z.array(
      z.object({
        id: z.uuid(),
        type: TimeOffTypeSchema,
        status: TimeOffStatusSchema,
        startDate: z.iso.date(),
        endDate: z.iso.date(),
        days: z.number().int(),
      }),
    ),
  })
  .meta({ id: 'TimeOffCalendarRow' });

export class TimeOffCalendarResponse extends createZodDto(
  pageResponseSchema(TimeOffCalendarRowSchema).extend({
    /** First and last day of the month. */
    from: z.iso.date(),
    to: z.iso.date(),
    /** Company holidays in the month, by date. */
    holidays: z.array(z.object({ date: z.iso.date(), name: z.string() })).max(31),
  }),
) {}
