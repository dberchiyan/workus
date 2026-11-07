import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { notificationsApi } from '../api/notificationsApi';
import type { AppNotification, NotificationPage } from '../types';
import { notificationKeys } from './queryKeys';

export const NOTIFICATIONS_PAGE_SIZE = 10;
/** The bell asks for news this often while the tab is visible (no push channel yet). */
const POLL_MS = 60_000;

/** The badge: polled while the tab is visible and on focus. */
export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

/** The list behind the bell — loaded when it opens, fresh on every opening. */
export const useNotificationList = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => notificationsApi.page(pageParam, NOTIFICATIONS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements
        ? pages.length
        : undefined,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: enabled ? POLL_MS : false,
  });

type ListData = InfiniteData<NotificationPage, number>;

const withRead = (
  data: ListData | undefined,
  isRead: (notification: AppNotification) => boolean,
  readAt: string,
): ListData | undefined =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((notification) =>
        notification.readAt === null && isRead(notification)
          ? { ...notification, readAt }
          : notification,
      ),
    })),
  };

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation<AppNotification, ApiError, string>({
    mutationFn: notificationsApi.markRead,
    onSuccess: async (read) => {
      queryClient.setQueryData<ListData>(notificationKeys.list(), (data) =>
        withRead(data, (notification) => notification.id === read.id, read.readAt ?? ''),
      );
      await queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation<number, ApiError>({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: (unread) => {
      queryClient.setQueryData(notificationKeys.unreadCount(), unread);
      queryClient.setQueryData<ListData>(notificationKeys.list(), (data) =>
        withRead(data, () => true, new Date().toISOString()),
      );
    },
  });
};
