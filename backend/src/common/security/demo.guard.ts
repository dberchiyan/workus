import { type CanActivate, type ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../config/app-config.service';
import { DemoRestrictedException } from '../exception/api.exception';

const DEMO_RESTRICTED_KEY = 'security:demo-restricted';

/**
 * Refused in the public demo (DEMO_MODE): the action would lock other visitors out of the
 * shared accounts (passwords, roles, their sessions). Runs after authorisation.
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
      this.config.isDemo &&
      this.reflector.get<boolean | undefined>(DEMO_RESTRICTED_KEY, context.getHandler()) === true
    ) {
      throw new DemoRestrictedException();
    }
    return true;
  }
}
