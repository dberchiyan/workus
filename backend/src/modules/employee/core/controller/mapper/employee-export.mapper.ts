import type { AuditEvent, SecurityEvent } from '../../../../audit/service/audit.types';
import type { AuditValue } from '../../../../audit/service/audit-change';
import { toCsv } from '../../service/csv';

/** A change value in words for a spreadsheet (never secrets: redacted stays "changed"). */
const describe = (value: AuditValue | null): string => {
  if (value === null) {
    return '';
  }
  switch (value.kind) {
    case 'text':
      return value.text;
    case 'date':
      return value.date;
    case 'money':
      return `${value.money.amount} ${value.money.currency}`;
    case 'reviewStatus':
    case 'timeOffStatus':
      return value.status;
    case 'people':
      return value.people.map((person) => `${person.firstName} ${person.lastName}`).join('; ');
    case 'feedback':
      return '(feedback)';
    case 'terminationReason':
      return value.reason;
    case 'redacted':
      return '(changed)';
    case 'timeOffType':
      return value.type;
    case 'number':
      return String(value.number);
    case 'flag':
      return value.flag ? 'yes' : 'no';
  }
};

const ACTIVITY_HEADER = ['occurredAt', 'action', 'actor', 'targetType', 'target', 'changes'];

/** The employee's change history as CSV: one row per event, the changes in one cell. */
export const toActivityCsv = (events: readonly AuditEvent[]): string =>
  toCsv(
    ACTIVITY_HEADER,
    events.map((event) => [
      event.occurredAt.toISOString(),
      event.action,
      event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : 'system',
      event.target.type,
      event.target.label,
      event.changes
        .map((change) => `${change.field}: ${describe(change.from)} -> ${describe(change.to)}`)
        .join(' | '),
    ]),
  );

const SECURITY_HEADER = ['occurredAt', 'action', 'ipAddress', 'userAgent', 'newDevice'];

export const toSecurityLogCsv = (events: readonly SecurityEvent[]): string =>
  toCsv(
    SECURITY_HEADER,
    events.map((event) => [
      event.occurredAt.toISOString(),
      event.action,
      event.ipAddress ?? '',
      event.userAgent ?? '',
      event.newDevice ? 'yes' : 'no',
    ]),
  );
