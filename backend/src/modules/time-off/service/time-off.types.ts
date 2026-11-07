import type { AuditEvent } from '../../audit/service/audit.types';
import type { EmployeeCalendarRow } from '../../employee/core/service/employee.types';
import type {
  CalendarRequestRecord,
  ManagedTimeOffRequestRecord,
  TimeOffRequestRecord,
} from '../repository/record/time-off-request.record';
import type { TimeOffType } from './time-off-type';

export interface LeaveBalance {
  type: TimeOffType;
  cycleStart: Date;
  /** Last day of the cycle (inclusive). */
  cycleEnd: Date;
  /** Days per cycle; null = no limit (days off). */
  allowance: number | null;
  /** Approved working days in the cycle. */
  used: number;
  /** Pending working days in the cycle (reserved until decided). */
  pending: number;
  /** allowance − used − pending (never below 0); null without a limit. */
  available: number | null;
}

export interface TimeOffRequestView {
  request: TimeOffRequestRecord;
  /** The request's events, oldest first. */
  history: AuditEvent[];
  canCancel: boolean;
}

export interface TimeOffRequestPage {
  content: TimeOffRequestView[];
  totalElements: number;
}

/** A request as an admin sees it, with what the viewer may do with it. */
export interface ManagedTimeOffRequestView {
  request: ManagedTimeOffRequestRecord;
  /** The request's events, oldest first. */
  history: AuditEvent[];
  /** Only the request's responsible people decide; each action only from its statuses. */
  can: { approve: boolean; reject: boolean; cancel: boolean };
}

export interface ManagedTimeOffRequestPage {
  content: ManagedTimeOffRequestView[];
  totalElements: number;
}

export interface CreateTimeOffCommand {
  type: TimeOffType;
  startDate: string;
  endDate: string;
  note: string | undefined;
}

export interface AbsentPerson {
  /** The person's user id (for the avatar colour). */
  id: string;
  firstName: string;
  lastName: string;
}

/** Company-wide time off for the admin dashboard. */
export interface TimeOffOverview {
  pendingCount: number;
  oldestPendingCreatedAt: Date | null;
  /** People on approved time off today (first few, by name). */
  outToday: AbsentPerson[];
  outTodayCount: number;
  /** Others off on a later day of this week (Monday–Sunday). */
  outLaterThisWeekCount: number;
}

/** One person on the calendar with their approved and pending requests in the month. */
export interface CalendarRow {
  employee: EmployeeCalendarRow;
  requests: CalendarRequestRecord[];
}

export interface TimeOffCalendar {
  /** First and last day of the month. */
  from: Date;
  to: Date;
  content: CalendarRow[];
  totalElements: number;
}
