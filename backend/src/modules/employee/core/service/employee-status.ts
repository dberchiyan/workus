export const EmployeeStatus = {
    ACTIVE: 'ACTIVE',
    TERMINATED: 'TERMINATED',
} as const;
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const EMPLOYEE_STATUSES = Object.values(EmployeeStatus) as [EmployeeStatus, ...EmployeeStatus[]];

/** Terminated from `terminatedAt` (inclusive); everything else is active. */
export const statusOn = (terminatedAt: Date | null, today: Date): EmployeeStatus =>
    terminatedAt !== null && terminatedAt.getTime() <= today.getTime()
        ? EmployeeStatus.TERMINATED
        : EmployeeStatus.ACTIVE;
