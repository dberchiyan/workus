/** Mirrored by ck_time_off_requests_type. */
export const TimeOffType = {
  VACATION: 'VACATION',
  SICK_DAY: 'SICK_DAY',
  DAY_OFF: 'DAY_OFF',
} as const;
export type TimeOffType = (typeof TimeOffType)[keyof typeof TimeOffType];
export const TIME_OFF_TYPES = Object.values(TimeOffType) as [TimeOffType, ...TimeOffType[]];
export const isTimeOffType = (value: string): value is TimeOffType =>
  (TIME_OFF_TYPES as readonly string[]).includes(value);

/** Mirrored by ck_time_off_requests_status. */
export const TimeOffStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
} as const;
export type TimeOffStatus = (typeof TimeOffStatus)[keyof typeof TimeOffStatus];
export const TIME_OFF_STATUSES = Object.values(TimeOffStatus) as [
  TimeOffStatus,
  ...TimeOffStatus[],
];
export const isTimeOffStatus = (value: string): value is TimeOffStatus =>
  (TIME_OFF_STATUSES as readonly string[]).includes(value);

/** Statuses that hold days: approved ones are used, pending ones are reserved. */
export const HOLDING_STATUSES: readonly TimeOffStatus[] = [
  TimeOffStatus.PENDING,
  TimeOffStatus.APPROVED,
];
