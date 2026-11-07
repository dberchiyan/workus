import { z } from 'zod';

/** Mirrored by ck_notifications_type. */
export const NotificationType = {
  /** An employee asked for time off — to the request's responsible people. */
  TIME_OFF_REQUESTED: 'TIME_OFF_REQUESTED',
  /** To the employee. */
  TIME_OFF_APPROVED: 'TIME_OFF_APPROVED',
  /** To the employee. */
  TIME_OFF_REJECTED: 'TIME_OFF_REJECTED',
  /** A responsible person canceled it — to the employee. */
  TIME_OFF_CANCELED: 'TIME_OFF_CANCELED',
  /** The employee canceled their own request — to its responsible people. */
  TIME_OFF_WITHDRAWN: 'TIME_OFF_WITHDRAWN',
  /** An admin made the recipient one of a pending request's responsible people. */
  TIME_OFF_ASSIGNED: 'TIME_OFF_ASSIGNED',
  /** A comment — to the employee and the responsible people, never the author. */
  TIME_OFF_COMMENTED: 'TIME_OFF_COMMENTED',
  /** A request has waited for a decision too long — to its responsible people (no actor). */
  TIME_OFF_REMINDER: 'TIME_OFF_REMINDER',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const NOTIFICATION_TYPES = Object.values(NotificationType) as [
  NotificationType,
  ...NotificationType[],
];
export const isNotificationType = (value: string): value is NotificationType =>
  (NOTIFICATION_TYPES as readonly string[]).includes(value);

/** Mirrored by ck_notifications_subject_type. */
export const NotificationSubjectType = {
  TIME_OFF_REQUEST: 'time_off_request',
} as const;
export type NotificationSubjectType =
  (typeof NotificationSubjectType)[keyof typeof NotificationSubjectType];

/**
 * What a time-off notice's text needs, as it was when it was sent (`params` column). The type
 * and status values are the time-off module's; they are kept as strings, like the audit log.
 */
export const TimeOffNoticeParamsSchema = z.object({
  requestType: z.string().max(16),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  /** Whose request it is; the recipient's own when they are this user. */
  employee: z.object({
    userId: z.uuid(),
    firstName: z.string().max(100),
    lastName: z.string().max(100),
  }),
  /** Reminders: whole days since the request was made. */
  waitingDays: z.number().int().min(0).optional(),
});
export type TimeOffNoticeParams = z.infer<typeof TimeOffNoticeParamsSchema>;
