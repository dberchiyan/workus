/** `<resource>.<past_tense>` — the list is mirrored by ck_audit_events_action. */
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
  /** Company holidays — target type `holiday`, no employee. */
  HOLIDAY_CREATED: 'holiday.created',
  HOLIDAY_UPDATED: 'holiday.updated',
  HOLIDAY_DELETED: 'holiday.deleted',
  /** The organisation itself (target type `organisation`) and people's roles (target `user`). */
  ORGANISATION_CREATED: 'organisation.created',
  ORGANISATION_UPDATED: 'organisation.updated',
  /** A Workus platform admin decided on a sign-up (in the company's own history). */
  ORGANISATION_APPROVED: 'organisation.approved',
  ORGANISATION_REJECTED: 'organisation.rejected',
  USER_ROLE_CHANGED: 'user.role_changed',
  /** An owner added an administrator (an account with a generated password). */
  USER_CREATED: 'user.created',
  /** An admin or owner renamed themselves (Settings → Account). */
  USER_UPDATED: 'user.updated',
  /** Company structure (Settings) — target types `department`, `position`, no employee. */
  DEPARTMENT_CREATED: 'department.created',
  DEPARTMENT_UPDATED: 'department.updated',
  DEPARTMENT_DELETED: 'department.deleted',
  POSITION_CREATED: 'position.created',
  POSITION_UPDATED: 'position.updated',
  POSITION_DELETED: 'position.deleted',
  /** Security log — target type `user`, no employee (never in the Activity tab). */
  AUTH_SIGNED_IN: 'auth.signed_in',
  AUTH_SIGN_IN_FAILED: 'auth.sign_in_failed',
  AUTH_SIGN_IN_REFUSED: 'auth.sign_in_refused',
  AUTH_SIGNED_OUT: 'auth.signed_out',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',
  /** An admin gave the person a new generated password; every session of theirs ended. */
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_SESSION_ENDED: 'auth.session_ended',
  AUTH_OTHER_SESSIONS_ENDED: 'auth.other_sessions_ended',
  /** A sign-in elsewhere ended the least recently used session (per-user limit). */
  AUTH_SESSION_EVICTED: 'auth.session_evicted',
  /** The employment ended: every session of the person ended (by an admin or the daily job). */
  AUTH_SESSIONS_ENDED_ON_TERMINATION: 'auth.sessions_ended_on_termination',
  /** Too many wrong passwords from one IP: sign-in blocked there for a while. */
  AUTH_SIGN_IN_LOCKED: 'auth.sign_in_locked',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];

/** Mirrored by ck_audit_events_target_type. */
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
export const AUDIT_TARGET_TYPES = Object.values(AuditTargetType) as [
  AuditTargetType,
  ...AuditTargetType[],
];

/**
 * Not in any employee's history: the security log (auth.*), company holidays (holiday.*), the
 * organisation (organisation.*), roles (user.*) and the company structure (department.*,
 * position.*).
 */
type CompanyAction = Extract<
  AuditAction,
  | `auth.${string}`
  | `holiday.${string}`
  | `organisation.${string}`
  | `user.${string}`
  | `department.${string}`
  | `position.${string}`
>;
const COMPANY_PREFIXES = [
  'auth.',
  'holiday.',
  'organisation.',
  'user.',
  'department.',
  'position.',
] as const;
const isCompanyAction = (action: AuditAction): action is CompanyAction =>
  COMPANY_PREFIXES.some((prefix) => action.startsWith(prefix));

/** Actions of the records' history (Activity). */
export const RECORD_ACTIONS = AUDIT_ACTIONS.filter(
  (action): action is Exclude<AuditAction, CompanyAction> => !isCompanyAction(action),
) as [Exclude<AuditAction, CompanyAction>, ...Exclude<AuditAction, CompanyAction>[]];
export const isRecordAction = (action: AuditAction): action is (typeof RECORD_ACTIONS)[number] =>
  !isCompanyAction(action);
