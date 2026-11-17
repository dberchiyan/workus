import { z } from 'zod';

import { MAX_PERSON_NAME_LENGTH, MAX_TYPE_LENGTH } from '../../../common/dto/limits';

export const NotificationType = {
    TIME_OFF_REQUESTED: 'TIME_OFF_REQUESTED',
    TIME_OFF_APPROVED: 'TIME_OFF_APPROVED',
    TIME_OFF_REJECTED: 'TIME_OFF_REJECTED',
    TIME_OFF_CANCELED: 'TIME_OFF_CANCELED',
    TIME_OFF_WITHDRAWN: 'TIME_OFF_WITHDRAWN',
    TIME_OFF_ASSIGNED: 'TIME_OFF_ASSIGNED',
    TIME_OFF_COMMENTED: 'TIME_OFF_COMMENTED',
    TIME_OFF_REMINDER: 'TIME_OFF_REMINDER',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const NOTIFICATION_TYPES = Object.values(NotificationType) as [NotificationType, ...NotificationType[]];
export const isNotificationType = (value: string): value is NotificationType =>
    (NOTIFICATION_TYPES as readonly string[]).includes(value);

export const NotificationSubjectType = {
    TIME_OFF_REQUEST: 'time_off_request',
} as const;
export type NotificationSubjectType = (typeof NotificationSubjectType)[keyof typeof NotificationSubjectType];

export const TimeOffNoticeParamsSchema = z.object({
    requestType: z.string().max(MAX_TYPE_LENGTH),
    startsAt: z.iso.date(),
    endsAt: z.iso.date(),
    employee: z.object({
        userId: z.uuid(),
        firstName: z.string().max(MAX_PERSON_NAME_LENGTH),
        lastName: z.string().max(MAX_PERSON_NAME_LENGTH),
    }),
    waitingDays: z.number().int().min(0).optional(),
});
export type TimeOffNoticeParams = z.infer<typeof TimeOffNoticeParamsSchema>;
