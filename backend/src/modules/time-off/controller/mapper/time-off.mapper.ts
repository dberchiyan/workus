import { AuditAction } from '../../../audit/service/audit-action';
import type { AuditEvent } from '../../../audit/service/audit.types';
import {
  isTimeOffStatus,
  isTimeOffType,
  TimeOffStatus,
  TimeOffType,
} from '../../service/time-off-type';
import type {
  TimeOffCommentRecord,
  TimeOffRequestRecord,
} from '../../repository/record/time-off-request.record';
import type {
  LeaveBalance,
  ManagedTimeOffRequestPage,
  TimeOffCalendar,
  ManagedTimeOffRequestView,
  TimeOffRequestPage,
  TimeOffRequestView,
} from '../../service/time-off.types';
import type {
  LeaveBalancesResponse,
  ManagedTimeOffRequestPageResponse,
  ManagedTimeOffRequestResponse,
  TimeOffCalendarResponse,
  TimeOffCommentResponse,
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

export const toTimeOffCommentResponse = (
  comment: TimeOffCommentRecord,
): TimeOffCommentResponse => ({
  id: comment.id,
  body: comment.body,
  createdAt: comment.createdAt.toISOString(),
  author: person(comment.author),
});

/** Fields every view of a request shares. */
const requestFields = (request: TimeOffRequestRecord, history: AuditEvent[]) => ({
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
  // Read newest first (bounded), shown oldest first.
  comments: request.comments.map(toTimeOffCommentResponse).reverse(),
  commentCount: request._count.comments,
});

export const toTimeOffRequestResponse = ({
  request,
  history,
  canCancel,
}: TimeOffRequestView): TimeOffRequestResponse => ({
  ...requestFields(request, history),
  canCancel,
});

export const toManagedTimeOffRequestResponse = ({
  request,
  history,
  can,
}: ManagedTimeOffRequestView): ManagedTimeOffRequestResponse => ({
  ...requestFields(request, history),
  employee: {
    id: request.employeeId,
    userId: request.employee.user.id,
    firstName: request.employee.user.firstName,
    lastName: request.employee.user.lastName,
    email: request.employee.user.email,
    positionTitle: request.employee.position.title,
  },
  can,
});

export const toManagedTimeOffRequestPageResponse = (
  page: ManagedTimeOffRequestPage,
): ManagedTimeOffRequestPageResponse => ({
  content: page.content.map(toManagedTimeOffRequestResponse),
  totalElements: page.totalElements,
});

export const toTimeOffRequestPageResponse = (
  page: TimeOffRequestPage,
): TimeOffRequestPageResponse => ({
  content: page.content.map(toTimeOffRequestResponse),
  totalElements: page.totalElements,
});

export const toTimeOffCalendarResponse = (calendar: TimeOffCalendar): TimeOffCalendarResponse => ({
  from: isoDate(calendar.from),
  to: isoDate(calendar.to),
  content: calendar.content.map(({ employee, requests }) => ({
    employee: {
      id: employee.id,
      userId: employee.userId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      positionTitle: employee.positionTitle,
      startDate: isoDate(employee.startDate),
      terminatedOn: employee.terminatedOn ? isoDate(employee.terminatedOn) : null,
    },
    requests: requests.map((request) => ({
      id: request.id,
      // Guarded by ck_time_off_requests_type / _status.
      type: isTimeOffType(request.type) ? request.type : TimeOffType.DAY_OFF,
      status: isTimeOffStatus(request.status) ? request.status : TimeOffStatus.PENDING,
      startDate: isoDate(request.startDate),
      endDate: isoDate(request.endDate),
      days: request.days,
    })),
  })),
  totalElements: calendar.totalElements,
});
