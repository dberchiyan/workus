export const AuditAction = {
    EMPLOYEE_CREATED: 'employee.created',
    EMPLOYEE_UPDATED: 'employee.updated',
    EMPLOYEE_TERMINATED: 'employee.terminated',
    EMPLOYEE_TERMINATION_CANCELED: 'employee.termination_canceled',
    REVIEW_CREATED: 'review.created',
    REVIEW_UPDATED: 'review.updated',
    REVIEW_DELETED: 'review.deleted',
    TIME_OFF_REQUEST_CREATED: 'time_off_request.created',
    TIME_OFF_REQUEST_APPROVED: 'time_off_request.approved',
    TIME_OFF_REQUEST_REJECTED: 'time_off_request.rejected',
    TIME_OFF_REQUEST_CANCELED: 'time_off_request.canceled',
    TIME_OFF_REQUEST_UPDATED: 'time_off_request.updated',
    HOLIDAY_CREATED: 'holiday.created',
    HOLIDAY_UPDATED: 'holiday.updated',
    HOLIDAY_DELETED: 'holiday.deleted',
    ORGANISATION_CREATED: 'organisation.created',
    ORGANISATION_UPDATED: 'organisation.updated',
    ORGANISATION_APPROVED: 'organisation.approved',
    ORGANISATION_REJECTED: 'organisation.rejected',
    ORGANISATION_PLAN_CHANGED: 'organisation.plan_changed',
    USER_ROLE_CHANGED: 'user.role_changed',
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    DEPARTMENT_CREATED: 'department.created',
    DEPARTMENT_UPDATED: 'department.updated',
    DEPARTMENT_DELETED: 'department.deleted',
    POSITION_CREATED: 'position.created',
    POSITION_UPDATED: 'position.updated',
    POSITION_DELETED: 'position.deleted',
    AUTH_SIGNED_IN: 'auth.signed_in',
    AUTH_SIGN_IN_FAILED: 'auth.sign_in_failed',
    AUTH_SIGN_IN_REFUSED: 'auth.sign_in_refused',
    AUTH_SIGNED_OUT: 'auth.signed_out',
    AUTH_PASSWORD_CHANGED: 'auth.password_changed',
    AUTH_PASSWORD_RESET: 'auth.password_reset',
    AUTH_SESSION_ENDED: 'auth.session_ended',
    AUTH_OTHER_SESSIONS_ENDED: 'auth.other_sessions_ended',
    AUTH_SESSION_EVICTED: 'auth.session_evicted',
    AUTH_SESSIONS_ENDED_ON_TERMINATION: 'auth.sessions_ended_on_termination',
    AUTH_SIGN_IN_LOCKED: 'auth.sign_in_locked',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];

export const AuditTargetType = {
    EMPLOYEE: 'employee',
    REVIEW: 'review',
    TIME_OFF_REQUEST: 'time_off_request',
    HOLIDAY: 'holiday',
    USER: 'user',
    ORGANISATION: 'organisation',
    DEPARTMENT: 'department',
    POSITION: 'position',
} as const;
export type AuditTargetType = (typeof AuditTargetType)[keyof typeof AuditTargetType];
export const AUDIT_TARGET_TYPES = Object.values(AuditTargetType) as [AuditTargetType, ...AuditTargetType[]];

type CompanyAction = Extract<
    AuditAction,
    | `auth.${string}`
    | `holiday.${string}`
    | `organisation.${string}`
    | `user.${string}`
    | `department.${string}`
    | `position.${string}`
>;
const COMPANY_PREFIXES = ['auth.', 'holiday.', 'organisation.', 'user.', 'department.', 'position.'] as const;
const isCompanyAction = (action: AuditAction): action is CompanyAction =>
    COMPANY_PREFIXES.some((prefix) => action.startsWith(prefix));

export const RECORD_ACTIONS = AUDIT_ACTIONS.filter(
    (action): action is Exclude<AuditAction, CompanyAction> => !isCompanyAction(action),
) as [Exclude<AuditAction, CompanyAction>, ...Exclude<AuditAction, CompanyAction>[]];
export const isRecordAction = (action: AuditAction): action is (typeof RECORD_ACTIONS)[number] =>
    !isCompanyAction(action);
