import { type CanActivate, type ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsServiceManager } from 'nestjs-cls';
import { AppConfigService } from '../config/app-config.service';
import type { RequestContext } from '../context/request-context';
import { DemoRestrictedException } from '../exception/api.exception';

const DEMO_RESTRICTED_KEY = 'security:demo-restricted';

/**
 * Refused to the demo's showcase accounts (DEMO_MODE + DEMO_PROTECTED_EMAILS): the action would
 * lock other visitors out of the shared accounts (passwords, roles, their sessions). A company a
 * visitor created keeps every action. Runs after authorisation; actions on another person also
 * refuse a showcase account as the target (in their services).
 */
export const DemoRestricted = (): MethodDecorator => SetMetadata(DEMO_RESTRICTED_KEY, true);

@Injectable()
export class DemoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      !this.config.isDemo ||
      this.reflector.get<boolean | undefined>(DEMO_RESTRICTED_KEY, context.getHandler()) !== true
    ) {
      return true;
    }
    const principal = ClsServiceManager.getClsService<RequestContext>().get('principal');
    if (principal && this.config.isDemoProtected(principal.email)) {
      throw new DemoRestrictedException();
    }
    return true;
  }
}
