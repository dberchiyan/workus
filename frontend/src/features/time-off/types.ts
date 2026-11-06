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
