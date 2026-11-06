export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  TERMINATED: 'TERMINATED',
} as const;
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const EMPLOYEE_STATUSES = Object.values(EmployeeStatus) as [
  EmployeeStatus,
  ...EmployeeStatus[],
];

/** Terminated from `terminatedOn` (inclusive); everything else is active. */
export const statusOn = (terminatedOn: Date | null, today: Date): EmployeeStatus =>
  terminatedOn !== null && terminatedOn.getTime() <= today.getTime()
    ? EmployeeStatus.TERMINATED
    : EmployeeStatus.ACTIVE;
