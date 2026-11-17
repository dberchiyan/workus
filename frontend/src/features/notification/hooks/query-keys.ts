export const notificationKeys = {
    all: ['notifications'] as const,
    unreadCount: (): readonly ['notifications', 'unread-count'] => [...notificationKeys.all, 'unread-count'] as const,
    list: (): readonly ['notifications', 'list'] => [...notificationKeys.all, 'list'] as const,
};
