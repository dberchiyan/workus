import type { PermissionService } from './permission.service';
import type { Principal } from './principal';

export type PolicyArgs = Readonly<Record<string, string>>;

export type PolicyCheck = (
    principal: Principal,
    args: PolicyArgs,
    permissions: PermissionService,
) => boolean | Promise<boolean>;

export type PolicyScope = 'tenant' | 'account' | 'platform';

export interface Policy {
    readonly params: readonly string[];
    readonly check: PolicyCheck;
    readonly scope: PolicyScope;
}

export const policy = (params: readonly string[], check: PolicyCheck, scope: PolicyScope = 'tenant'): Policy => ({
    params,
    check,
    scope,
});
