import type { Schemas } from '@/shared/types';

export type AppNotification = Schemas['Notification_Output'];
export type NotificationType = AppNotification['type'];
export type NotificationPage = Schemas['NotificationPageResponse_Output'];
export type UnreadNotifications = Schemas['UnreadNotificationsResponse_Output'];
