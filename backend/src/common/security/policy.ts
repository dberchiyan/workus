import type { Principal } from './principal';

export type PolicyArgs = Readonly<Record<string, string>>;

export interface Policy {
  /** Path params the policy checks — every `:xxxId` in the route must be one of them. */
  readonly params: readonly string[];
  readonly check: (principal: Principal, args: PolicyArgs) => boolean | Promise<boolean>;
}

export const policy = (
  params: readonly string[],
  check: (principal: Principal, args: PolicyArgs) => boolean | Promise<boolean>,
): Policy => ({ params, check });
