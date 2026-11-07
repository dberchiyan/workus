import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import type { RequestContext } from '../context/request-context';
import { loginRateLimitKey, RATE_LIMIT_KEY, RateLimitName } from './rate-limit';
import { RateLimitService } from './rate-limit.service';
import { clientIp } from './request-client';

const readBodyField = (body: unknown, field: string): unknown =>
  typeof body === 'object' && body !== null && field in body
    ? (body as Record<string, unknown>)[field]
    : undefined;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly cls: ClsService<RequestContext>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const name = this.reflector.get<RateLimitName | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (name === RateLimitName.LOGIN) {
      const body: unknown = request.body;
      await this.rateLimitService.consume(
        name,
        loginRateLimitKey(clientIp(request), readBodyField(body, 'email')),
      );
      return true;
    }
    if (name === RateLimitName.REGISTRATION) {
      await this.rateLimitService.consume(name, [clientIp(request)]);
      return true;
    }
    const principal = this.cls.get('principal');
    if (name === RateLimitName.PASSWORD_CHANGE && principal) {
      await this.rateLimitService.consume(name, [principal.userId]);
      return true;
    }
    if (principal) {
      await this.rateLimitService.consumeSession(principal.sessionId);
    }
    return true;
  }
}
