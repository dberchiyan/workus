import { pageableOptions } from '../../../common/dto/pageable';

export const AUDIT_EVENT_PAGEABLE = pageableOptions({
    sortable: ['occurredAt'] as const,
    defaultSort: 'occurredAt,desc',
});

export type AuditEventSortField = (typeof AUDIT_EVENT_PAGEABLE.sortable)[number];
