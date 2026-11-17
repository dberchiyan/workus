import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_NOTE_LENGTH } from '../../../../common/dto/limits';
import { pageResponseSchema } from '../../../../common/dto/page.response';
import { MAX_DAYS_IN_MONTH } from '../../../../common/time/units';
import { TIME_OFF_STATUSES } from '../../service/time-off-type';
import { TimeOffTypeSchema } from './create-time-off-request.request';

export const TimeOffStatusSchema = z.enum(TIME_OFF_STATUSES).meta({ id: 'TimeOffStatus' });

export const PersonSchema = z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    positionTitle: z.string().nullable(),
});

export class LeaveBalancesResponse extends createZodDto(
    z.object({
        content: z.array(
            z.object({
                type: TimeOffTypeSchema,
                cycleStartsAt: z.iso.date(),
                cycleEndsAt: z.iso.date(),
                allowance: z.number().int().nullable(),
                used: z.number().int(),
                pending: z.number().int(),
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
        editedAt: z.iso.datetime().nullable(),
        author: PersonSchema,
    })
    .meta({ id: 'TimeOffComment' });

const requestShape = {
    id: z.uuid(),
    type: TimeOffTypeSchema,
    startsAt: z.iso.date(),
    endsAt: z.iso.date(),
    days: z.number().int(),
    status: TimeOffStatusSchema,
    note: z.string().max(MAX_NOTE_LENGTH).nullable(),
    decisionComment: z.string().max(MAX_NOTE_LENGTH).nullable(),
    createdAt: z.iso.datetime(),
    decidedAt: z.iso.datetime().nullable(),
    decidedBy: PersonSchema.nullable(),
    responsibles: z.array(PersonSchema),
    history: z.array(
        z.object({
            id: z.uuid(),
            action: z.enum(['CREATED', 'APPROVED', 'REJECTED', 'CANCELED', 'RESPONSIBLES_CHANGED']),
            occurredAt: z.iso.datetime(),
            actor: PersonSchema.nullable(),
        }),
    ),
    comments: z.array(TimeOffCommentSchema),
    commentCount: z.number().int(),
};

export const TimeOffRequestSchema = z
    .object({ ...requestShape, canCancel: z.boolean() })
    .meta({ id: 'TimeOffRequest' });

export const ManagedTimeOffRequestSchema = z
    .object({
        ...requestShape,
        employee: z.object({
            id: z.uuid(),
            userId: z.uuid(),
            firstName: z.string(),
            lastName: z.string(),
            email: z.string(),
            positionTitle: z.string(),
        }),
        can: z.object({ approve: z.boolean(), reject: z.boolean(), cancel: z.boolean() }),
    })
    .meta({ id: 'ManagedTimeOffRequest' });

export class ManagedTimeOffRequestPageResponse extends createZodDto(pageResponseSchema(ManagedTimeOffRequestSchema)) {}

export class ManagedTimeOffRequestResponse extends createZodDto(z.object(ManagedTimeOffRequestSchema.shape)) {}

export class TimeOffCommentResponse extends createZodDto(z.object(TimeOffCommentSchema.shape)) {}

export class TimeOffRequestPageResponse extends createZodDto(pageResponseSchema(TimeOffRequestSchema)) {}

export class TimeOffRequestResponse extends createZodDto(z.object(TimeOffRequestSchema.shape)) {}

export const TimeOffCalendarRowSchema = z
    .object({
        employee: z.object({
            id: z.uuid(),
            userId: z.uuid(),
            firstName: z.string(),
            lastName: z.string(),
            positionTitle: z.string(),
            startsAt: z.iso.date(),
            terminatedAt: z.iso.date().nullable(),
        }),
        requests: z.array(
            z.object({
                id: z.uuid(),
                type: TimeOffTypeSchema,
                status: TimeOffStatusSchema,
                startsAt: z.iso.date(),
                endsAt: z.iso.date(),
                days: z.number().int(),
            }),
        ),
    })
    .meta({ id: 'TimeOffCalendarRow' });

export class TimeOffCalendarResponse extends createZodDto(
    pageResponseSchema(TimeOffCalendarRowSchema).extend({
        from: z.iso.date(),
        to: z.iso.date(),
        holidays: z.array(z.object({ heldAt: z.iso.date(), name: z.string() })).max(MAX_DAYS_IN_MONTH),
    }),
) {}
