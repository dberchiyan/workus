import { pageableOptions } from '../../../common/dto/pageable';

export const TIME_OFF_REQUEST_PAGEABLE = pageableOptions({
    sortable: ['createdAt'] as const,
    defaultSort: 'createdAt,desc',
});

export type TimeOffRequestSortField = (typeof TIME_OFF_REQUEST_PAGEABLE.sortable)[number];

export const MANAGED_REQUEST_PAGEABLE = pageableOptions({
    sortable: ['createdAt', 'updatedAt'] as const,
    defaultSort: 'createdAt,asc',
});

export type ManagedRequestSortField = (typeof MANAGED_REQUEST_PAGEABLE.sortable)[number];

export const CALENDAR_PAGEABLE = pageableOptions({
    sortable: ['name'] as const,
    defaultSort: 'name,asc',
});

export type CalendarSortField = (typeof CALENDAR_PAGEABLE.sortable)[number];
