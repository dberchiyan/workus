import type { Schemas } from '@/shared/types';

export type LeaveBalances = Schemas['LeaveBalancesResponse_Output'];
export type LeaveBalance = LeaveBalances['content'][number];
export type TimeOffType = Schemas['TimeOffType_Output'];
export type TimeOffStatus = Schemas['TimeOffStatus_Output'];
export type TimeOffRequest = Schemas['TimeOffRequest_Output'];
export type TimeOffRequestPage = Schemas['TimeOffRequestPageResponse_Output'];
export type TimeOffPerson = TimeOffRequest['responsibles'][number];
export type TimeOffHistoryItem = TimeOffRequest['history'][number];
export type CreateTimeOffRequest = Schemas['CreateTimeOffRequestRequest'];
export type TimeOffComment = Schemas['TimeOffComment_Output'];
/** A request as an admin sees it: whose it is and what the viewer may do with it. */
export type ManagedRequest = Schemas['ManagedTimeOffRequest_Output'];
export type ManagedRequestPage = Schemas['ManagedTimeOffRequestPageResponse_Output'];
/** One month of the company calendar: people with their approved and pending requests. */
export type TimeOffCalendar = Schemas['TimeOffCalendarResponse_Output'];
export type CalendarRow = TimeOffCalendar['content'][number];
export type CalendarRequest = CalendarRow['requests'][number];
export type TimeOffDecision = 'approve' | 'reject' | 'cancel';
export type ClosedStatus = Exclude<TimeOffStatus, 'PENDING'>;
export const CLOSED_STATUSES = [
  'APPROVED',
  'REJECTED',
  'CANCELED',
] as const satisfies readonly ClosedStatus[];

/** Card order: as on the profile and the dashboard. */
export const TIME_OFF_TYPES = [
  'VACATION',
  'SICK_DAY',
  'DAY_OFF',
] as const satisfies readonly TimeOffType[];

export const TIME_OFF_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELED',
] as const satisfies readonly TimeOffStatus[];

const TYPE_SET: ReadonlySet<string> = new Set(TIME_OFF_TYPES);
const STATUS_SET: ReadonlySet<string> = new Set(TIME_OFF_STATUSES);
export const isTimeOffType = (value: string): value is TimeOffType => TYPE_SET.has(value);
export const isTimeOffStatus = (value: string): value is TimeOffStatus => STATUS_SET.has(value);
