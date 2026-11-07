import { apiClient } from '@/shared/api/client';
import type { AppNotification, NotificationPage, UnreadNotifications } from '../types';

const BASE = '/api/v1/notifications';

export const notificationsApi = {
  page: async (page: number, size: number): Promise<NotificationPage> =>
    (await apiClient.get<NotificationPage>(BASE, { params: { page, size } })).data,
  unreadCount: async (): Promise<number> =>
    (await apiClient.get<UnreadNotifications>(`${BASE}/unread-count`)).data.count,
  markRead: async (notificationId: string): Promise<AppNotification> =>
    (await apiClient.put<AppNotification>(`${BASE}/${encodeURIComponent(notificationId)}/read`))
      .data,
  /** Answers the unread count afterwards (0 unless new ones arrived meanwhile). */
  markAllRead: async (): Promise<number> =>
    (await apiClient.put<UnreadNotifications>(`${BASE}/read`)).data.count,
};
