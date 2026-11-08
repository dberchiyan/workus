import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { type RequestContext, SessionState } from '../context/request-context';
import {
  AccessDeniedException,
  NotAuthenticatedException,
  OrganisationNotActiveException,
  SessionExpiredException,
} from '../exception/api.exception';
import { PermissionService } from './permission.service';
import type { Policy, PolicyArgs } from './policy';
import { POLICY_KEY, PUBLIC_KEY } from './security.decorators';

/** The authority of Workus platform admins (role PLATFORM_ADMIN). */
export const PLATFORM_ADMIN_AUTHORITY = 'PLATFORM_ADMIN';

/**
 * Deny by default: a handler runs only if it is public or its policy passes. Tenant routes also
 * need an approved organisation and a caller who is not a platform admin.
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService<RequestContext>,
    private readonly permissions: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    if (this.reflector.get<boolean | undefined>(PUBLIC_KEY, handler) === true) {
      return true;
    }
    const requiredPolicy = this.reflector.get<Policy | undefined>(POLICY_KEY, handler);
    if (!requiredPolicy) {
      return false;
    }
    const principal = this.cls.get('principal');
    if (!principal) {
      throw this.cls.get('sessionState') === SessionState.EXPIRED
        ? new SessionExpiredException()
        : new NotAuthenticatedException();
    }
    if (requiredPolicy.scope === 'tenant') {
      // Platform authorities never reach tenant data (security.md → Authorisation).
      if (principal.hasAuthority(PLATFORM_ADMIN_AUTHORITY)) {
        throw new AccessDeniedException();
      }
      // A company waiting for approval (or rejected) has only its own accounts open.
      if (!principal.isOrganisationActive) {
        throw new OrganisationNotActiveException();
      }
    }
    const request = context.switchToHttp().getRequest<Request>();
    const args: PolicyArgs = Object.fromEntries(
      requiredPolicy.params.map((name) => {
        const value: unknown = Reflect.get(request.params, name);
        return [name, typeof value === 'string' ? value : ''];
      }),
    );
    return requiredPolicy.check(principal, args, this.permissions);
  }
}
