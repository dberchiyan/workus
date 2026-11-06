import { AuditAction } from '../../../audit/service/audit-action';
import type { AuditEvent } from '../../../audit/service/audit.types';
import {
  isTimeOffStatus,
  isTimeOffType,
  TimeOffStatus,
  TimeOffType,
} from '../../service/time-off-type';
import type {
  LeaveBalance,
  TimeOffRequestPage,
  TimeOffRequestView,
} from '../../service/time-off.types';
import type {
  LeaveBalancesResponse,
  TimeOffRequestPageResponse,
  TimeOffRequestResponse,
} from '../dto/time-off.response';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

interface PersonRecord {
  id: string;
  firstName: string;
  lastName: string;
  employee: { position: { title: string } } | null;
}

const person = (user: PersonRecord) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  positionTitle: user.employee?.position.title ?? null,
});

const HISTORY_ACTIONS = {
  [AuditAction.TIME_OFF_REQUEST_CREATED]: 'CREATED',
  [AuditAction.TIME_OFF_REQUEST_APPROVED]: 'APPROVED',
  [AuditAction.TIME_OFF_REQUEST_REJECTED]: 'REJECTED',
  [AuditAction.TIME_OFF_REQUEST_CANCELED]: 'CANCELED',
} as const;
const isHistoryAction = (action: string): action is keyof typeof HISTORY_ACTIONS =>
  action in HISTORY_ACTIONS;

const historyOf = (events: AuditEvent[]) =>
  events.flatMap((event) =>
    isHistoryAction(event.action)
      ? [
          {
            id: event.id,
            action: HISTORY_ACTIONS[event.action],
            occurredAt: event.occurredAt.toISOString(),
            actor: event.actor,
          },
        ]
      : [],
  );

export const toLeaveBalancesResponse = (balances: LeaveBalance[]): LeaveBalancesResponse => ({
  content: balances.map((balance) => ({
    type: balance.type,
    cycleStart: isoDate(balance.cycleStart),
    cycleEnd: isoDate(balance.cycleEnd),
    allowance: balance.allowance,
    used: balance.used,
    pending: balance.pending,
    available: balance.available,
  })),
});

export const toTimeOffRequestResponse = ({
  request,
  history,
  canCancel,
}: TimeOffRequestView): TimeOffRequestResponse => ({
  id: request.id,
  // Guarded by ck_time_off_requests_type / _status.
  type: isTimeOffType(request.type) ? request.type : TimeOffType.DAY_OFF,
  startDate: isoDate(request.startDate),
  endDate: isoDate(request.endDate),
  days: request.days,
  status: isTimeOffStatus(request.status) ? request.status : TimeOffStatus.PENDING,
  note: request.note,
  decisionComment: request.decisionComment,
  createdAt: request.createdAt.toISOString(),
  decidedAt: request.decidedAt?.toISOString() ?? null,
  decidedBy: request.decider ? person(request.decider) : null,
  responsibles: request.responsibles.map(({ responsible }) => person(responsible)),
  history: historyOf(history),
  canCancel,
});

export const toTimeOffRequestPageResponse = (
  page: TimeOffRequestPage,
): TimeOffRequestPageResponse => ({
  content: page.content.map(toTimeOffRequestResponse),
  totalElements: page.totalElements,
});
