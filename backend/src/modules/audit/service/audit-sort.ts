import { pageableOptions } from '../../../common/dto/pageable';

/** Newest first; the history has one meaningful order. */
export const AUDIT_EVENT_PAGEABLE = pageableOptions({
  sortable: ['occurredAt'] as const,
  defaultSort: 'occurredAt,desc',
});

export type AuditEventSortField = (typeof AUDIT_EVENT_PAGEABLE.sortable)[number];
