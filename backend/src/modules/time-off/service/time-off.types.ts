import type { AuditEvent } from '../../audit/service/audit.types';
import type { EmployeeCalendarRow } from '../../employee/core/service/employee.types';
import type {
    CalendarRequestRecord,
    ManagedTimeOffRequestRecord,
    TimeOffRequestRecord,
} from '../repository/record/time-off-request.record';
import type { TimeOffStatus, TimeOffType } from './time-off-type';

export interface LeaveBalance {
    type: TimeOffType;
    cycleStartsAt: Date;
    cycleEndsAt: Date;
    allowance: number | null;
    used: number;
    pending: number;
    available: number | null;
}

export interface TimeOffRequestView {
    request: TimeOffRequestRecord;
    history: AuditEvent[];
    canCancel: boolean;
}

export interface TimeOffRequestPage {
    content: TimeOffRequestView[];
    totalElements: number;
}

export interface ManagedTimeOffRequestView {
    request: ManagedTimeOffRequestRecord;
    history: AuditEvent[];
    can: { approve: boolean; reject: boolean; cancel: boolean };
}

export interface ManagedTimeOffRequestPage {
    content: ManagedTimeOffRequestView[];
    totalElements: number;
}

export interface CreateTimeOffCommand {
    type: TimeOffType;
    startsAt: string;
    endsAt: string;
    note: string | undefined;
}

export interface AbsentPerson {
    id: string;
    firstName: string;
    lastName: string;
}

export interface TimeOffOverview {
    pendingCount: number;
    oldestPendingCreatedAt: Date | null;
    outToday: AbsentPerson[];
    outTodayCount: number;
    outLaterThisWeekCount: number;
}

export interface CalendarRow {
    employee: EmployeeCalendarRow;
    requests: CalendarRequestRecord[];
}

export interface TimeOffCalendar {
    from: Date;
    to: Date;
    holidays: { heldAt: Date; name: string }[];
    content: CalendarRow[];
    totalElements: number;
}

export interface DashboardRequest {
    id: string;
    type: TimeOffType;
    status: TimeOffStatus;
    startsAt: Date;
    endsAt: Date;
    days: number;
    createdAt: Date;
    employee: {
        id: string;
        userId: string;
        firstName: string;
        lastName: string;
        positionTitle: string;
    };
}

export interface DashboardRequests {
    content: DashboardRequest[];
    totalElements: number;
}
