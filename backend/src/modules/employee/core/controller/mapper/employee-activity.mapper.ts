import type { AuditEventPage } from '../../../../audit/service/audit.types';
import type { EmployeeActivityPageResponse } from '../dto/employee-activity.response';

export const toEmployeeActivityPageResponse = (
  page: AuditEventPage,
): EmployeeActivityPageResponse => ({
  content: page.content.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    action: event.action,
    actor: event.actor,
    target: event.target,
    changes: event.changes,
  })),
  totalElements: page.totalElements,
});
