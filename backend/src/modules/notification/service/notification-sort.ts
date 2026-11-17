import { pageableOptions } from '../../../common/dto/pageable';

export const NOTIFICATION_PAGEABLE = pageableOptions({
    sortable: ['createdAt'] as const,
    defaultSort: 'createdAt,desc',
});

export type NotificationSortField = (typeof NOTIFICATION_PAGEABLE.sortable)[number];
