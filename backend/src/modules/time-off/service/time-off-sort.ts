import { pageableOptions } from '../../../common/dto/pageable';

/** Newest first. */
export const TIME_OFF_REQUEST_PAGEABLE = pageableOptions({
  sortable: ['createdAt'] as const,
  defaultSort: 'createdAt,desc',
});

export type TimeOffRequestSortField = (typeof TIME_OFF_REQUEST_PAGEABLE.sortable)[number];

/** Admin lists: pending by waiting time (oldest first), closed by the last change. */
export const MANAGED_REQUEST_PAGEABLE = pageableOptions({
  sortable: ['createdAt', 'updatedAt'] as const,
  defaultSort: 'createdAt,asc',
});

export type ManagedRequestSortField = (typeof MANAGED_REQUEST_PAGEABLE.sortable)[number];

/** Calendar rows: people by name. */
export const CALENDAR_PAGEABLE = pageableOptions({
  sortable: ['name'] as const,
  defaultSort: 'name,asc',
});

export type CalendarSortField = (typeof CALENDAR_PAGEABLE.sortable)[number];
