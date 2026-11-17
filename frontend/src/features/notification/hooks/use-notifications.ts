import type { UseInfiniteQueryResult, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { notificationsApi } from '../api/notifications-api';
import type { AppNotification, NotificationPage } from '../types';
import { notificationKeys } from './query-keys';

export const NOTIFICATIONS_PAGE_SIZE = 10;
/** The bell asks for news this often while the tab is visible (no push channel yet). */
const POLL_MS = 60_000;

/** The badge: polled while the tab is visible and on focus. */
export const useUnreadCount = (): UseQueryResult<number> =>
    useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: notificationsApi.unreadCount,
        refetchInterval: POLL_MS,
        refetchIntervalInBackground: false,
    });

/** The list behind the bell — loaded when it opens, fresh on every opening. */
export const useNotificationList = (
    enabled: boolean,
): UseInfiniteQueryResult<
    InfiniteData<{ content: components['schemas']['Notification_Output'][]; totalElements: number }>
> =>
    useInfiniteQuery({
        queryKey: notificationKeys.list(),
        queryFn: ({ pageParam }) => notificationsApi.page(pageParam, NOTIFICATIONS_PAGE_SIZE),
        initialPageParam: 0,
        getNextPageParam: (last, pages) =>
            pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements ? pages.length : undefined,
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
                notification.readAt === null && isRead(notification) ? { ...notification, readAt } : notification,
            ),
        })),
    };

export const useMarkRead = (): UseMutationResult<
    {
        id: string;
        type:
            | 'TIME_OFF_REQUESTED'
            | 'TIME_OFF_APPROVED'
            | 'TIME_OFF_REJECTED'
            | 'TIME_OFF_CANCELED'
            | 'TIME_OFF_WITHDRAWN'
            | 'TIME_OFF_ASSIGNED'
            | 'TIME_OFF_COMMENTED'
            | 'TIME_OFF_REMINDER';
        createdAt: string;
        readAt: string | null;
        actor: { id: string; firstName: string; lastName: string } | null;
        subject: { type: 'time_off_request'; id: string };
        request: {
            type: string;
            startsAt: string;
            endsAt: string;
            employee: { userId: string; firstName: string; lastName: string };
            waitingDays: number | null;
        };
    },
    ApiError,
    string
> => {
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

export const useMarkAllRead = (): UseMutationResult<number, ApiError, void> => {
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
