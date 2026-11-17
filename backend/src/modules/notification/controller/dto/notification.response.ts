import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_PERSON_NAME_LENGTH, MAX_TYPE_LENGTH } from '../../../../common/dto/limits';
import { pageResponseSchema } from '../../../../common/dto/page.response';
import { NOTIFICATION_TYPES } from '../../service/notification-type';

export const NotificationSchema = z
    .object({
        id: z.uuid(),
        type: z.enum(NOTIFICATION_TYPES),
        createdAt: z.iso.datetime(),
        readAt: z.iso.datetime().nullable(),
        actor: z
            .object({
                id: z.uuid(),
                firstName: z.string().max(MAX_PERSON_NAME_LENGTH),
                lastName: z.string().max(MAX_PERSON_NAME_LENGTH),
            })
            .nullable(),
        subject: z.object({ type: z.enum(['time_off_request']), id: z.uuid() }),
        request: z.object({
            type: z.string().max(MAX_TYPE_LENGTH),
            startsAt: z.iso.date(),
            endsAt: z.iso.date(),
            employee: z.object({
                userId: z.uuid(),
                firstName: z.string().max(MAX_PERSON_NAME_LENGTH),
                lastName: z.string().max(MAX_PERSON_NAME_LENGTH),
            }),
            waitingDays: z.number().int().min(0).nullable(),
        }),
    })
    .meta({ id: 'Notification' });

export class NotificationResponse extends createZodDto(z.object(NotificationSchema.shape)) {}
export class NotificationPageResponse extends createZodDto(pageResponseSchema(NotificationSchema)) {}

export class UnreadNotificationsResponse extends createZodDto(z.object({ count: z.number().int().min(0) })) {}
