import type { Principal } from './principal';

export const SessionLookup = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
} as const;
export type SessionLookup = (typeof SessionLookup)[keyof typeof SessionLookup];

export type SessionAuthentication =
  | { result: typeof SessionLookup.VALID; principal: Principal }
  | { result: typeof SessionLookup.EXPIRED | typeof SessionLookup.UNKNOWN };

/** Implemented by the auth module, which owns the sessions table. */
export abstract class SessionAuthenticator {
  abstract authenticate(token: string): Promise<SessionAuthentication>;
}
