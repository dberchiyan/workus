import { policy } from './policy';

/** Declared constants, never built inline. */
export const can = {
  /** Caller's own account only: /auth/me, /auth/logout. */
  authenticated: policy([], () => true),
  admin: policy([], (principal) => principal.hasAuthority('ADMIN')),
} as const;
