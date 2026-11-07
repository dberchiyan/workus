import { isRecordAction } from '../../../../audit/service/audit-action';
import type { AuditEventPage } from '../../../../audit/service/audit.types';
import type { EmployeeActivityPageResponse } from '../dto/employee-activity.response';

export const toEmployeeActivityPageResponse = (
  page: AuditEventPage,
): EmployeeActivityPageResponse => ({
  // Security events have no employee, so they never come here; the filter keeps the type exact.
  content: page.content.flatMap((event) =>
    isRecordAction(event.action)
      ? [
          {
            id: event.id,
            occurredAt: event.occurredAt.toISOString(),
            action: event.action,
            actor: event.actor,
            target: event.target,
            changes: event.changes,
          },
        ]
      : [],
  ),
  totalElements: page.totalElements,
});
