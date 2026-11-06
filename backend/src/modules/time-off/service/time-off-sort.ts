import { pageableOptions } from '../../../common/dto/pageable';

/** Newest first. */
export const TIME_OFF_REQUEST_PAGEABLE = pageableOptions({
  sortable: ['createdAt'] as const,
  defaultSort: 'createdAt,desc',
});

export type TimeOffRequestSortField = (typeof TIME_OFF_REQUEST_PAGEABLE.sortable)[number];
