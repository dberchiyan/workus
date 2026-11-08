import type { PermissionService } from './permission.service';
import type { Principal } from './principal';

export type PolicyArgs = Readonly<Record<string, string>>;

export type PolicyCheck = (
  principal: Principal,
  args: PolicyArgs,
  permissions: PermissionService,
) => boolean | Promise<boolean>;

/**
 * Where a route works: `tenant` — an active organisation's data (never for platform admins, never
 * while the organisation waits for approval); `account` — the caller's own account (sign-out,
 * password, sessions), for anyone signed in; `platform` — Workus platform administration.
 */
export type PolicyScope = 'tenant' | 'account' | 'platform';

export interface Policy {
  /** Path params the policy checks — every `:xxxId` in the route must be one of them. */
  readonly params: readonly string[];
  readonly check: PolicyCheck;
  readonly scope: PolicyScope;
}

export const policy = (
  params: readonly string[],
  check: PolicyCheck,
  scope: PolicyScope = 'tenant',
): Policy => ({ params, check, scope });
