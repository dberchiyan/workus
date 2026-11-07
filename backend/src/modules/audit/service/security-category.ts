import { AuditAction } from './audit-action';

/** Security-log filter groups (Settings → Security log, an employee's Security tab). */
export const SECURITY_CATEGORIES = ['SIGN_INS', 'FAILED', 'PASSWORD', 'SESSIONS'] as const;
export type SecurityCategory = (typeof SECURITY_CATEGORIES)[number];

export const SECURITY_CATEGORY_ACTIONS: Record<SecurityCategory, readonly AuditAction[]> = {
  SIGN_INS: [AuditAction.AUTH_SIGNED_IN, AuditAction.AUTH_SIGNED_OUT],
  FAILED: [
    AuditAction.AUTH_SIGN_IN_FAILED,
    AuditAction.AUTH_SIGN_IN_REFUSED,
    AuditAction.AUTH_SIGN_IN_LOCKED,
  ],
  PASSWORD: [AuditAction.AUTH_PASSWORD_CHANGED],
  SESSIONS: [
    AuditAction.AUTH_SESSION_ENDED,
    AuditAction.AUTH_OTHER_SESSIONS_ENDED,
    AuditAction.AUTH_SESSION_EVICTED,
    AuditAction.AUTH_SESSIONS_ENDED_ON_TERMINATION,
  ],
};
