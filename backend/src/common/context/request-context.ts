import type { ClsStore } from 'nestjs-cls';
import type { Principal } from '../security/principal';

export const SessionState = {
  NONE: 'NONE',
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
} as const;
export type SessionState = (typeof SessionState)[keyof typeof SessionState];

/** Per-request context; the trace id is the CLS id. */
export interface RequestContext extends ClsStore {
  principal?: Principal;
  sessionState?: SessionState;
  queryCount?: number;
  /** For audit events: the caller's IP (Express `trust proxy`) and user agent. */
  clientIp?: string;
  userAgent?: string | null;
}
