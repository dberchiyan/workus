import { pageableOptions } from '../../../common/dto/pageable';

/** Newest first; the bell has one meaningful order. */
export const NOTIFICATION_PAGEABLE = pageableOptions({
  sortable: ['createdAt'] as const,
  defaultSort: 'createdAt,desc',
});

export type NotificationSortField = (typeof NOTIFICATION_PAGEABLE.sortable)[number];
