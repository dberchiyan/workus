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
  /** Security log — target type `user`, no employee (never in the Activity tab). */
  AUTH_SIGNED_IN: 'auth.signed_in',
  AUTH_SIGN_IN_FAILED: 'auth.sign_in_failed',
  AUTH_SIGN_IN_REFUSED: 'auth.sign_in_refused',
  AUTH_SIGNED_OUT: 'auth.signed_out',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',
  AUTH_SESSION_ENDED: 'auth.session_ended',
  AUTH_OTHER_SESSIONS_ENDED: 'auth.other_sessions_ended',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];

/** Mirrored by ck_audit_events_target_type. */
export const AuditTargetType = {
  EMPLOYEE: 'employee',
  REVIEW: 'review',
  TIME_OFF_REQUEST: 'time_off_request',
  USER: 'user',
} as const;
export type AuditTargetType = (typeof AuditTargetType)[keyof typeof AuditTargetType];
export const AUDIT_TARGET_TYPES = Object.values(AuditTargetType) as [
  AuditTargetType,
  ...AuditTargetType[],
];

/** Actions of the records' history (Activity) — everything but the security log (auth.*). */
export const RECORD_ACTIONS = AUDIT_ACTIONS.filter(
  (action): action is Exclude<AuditAction, `auth.${string}`> => !action.startsWith('auth.'),
) as [Exclude<AuditAction, `auth.${string}`>, ...Exclude<AuditAction, `auth.${string}`>[]];
export const isRecordAction = (action: AuditAction): action is (typeof RECORD_ACTIONS)[number] =>
  !action.startsWith('auth.');
