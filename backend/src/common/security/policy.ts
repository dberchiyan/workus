import type { PermissionService } from './permission.service';
import type { Principal } from './principal';

export type PolicyArgs = Readonly<Record<string, string>>;

export type PolicyCheck = (
  principal: Principal,
  args: PolicyArgs,
  permissions: PermissionService,
) => boolean | Promise<boolean>;

export interface Policy {
  /** Path params the policy checks — every `:xxxId` in the route must be one of them. */
  readonly params: readonly string[];
  readonly check: PolicyCheck;
}

export const policy = (params: readonly string[], check: PolicyCheck): Policy => ({
  params,
  check,
});
