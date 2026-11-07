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
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];

/** Mirrored by ck_audit_events_target_type. */
export const AuditTargetType = {
  EMPLOYEE: 'employee',
  REVIEW: 'review',
  TIME_OFF_REQUEST: 'time_off_request',
} as const;
export type AuditTargetType = (typeof AuditTargetType)[keyof typeof AuditTargetType];
export const AUDIT_TARGET_TYPES = Object.values(AuditTargetType) as [
  AuditTargetType,
  ...AuditTargetType[],
];
