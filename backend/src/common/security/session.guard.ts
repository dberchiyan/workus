import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { AppConfigService } from '../config/app-config.service';
import { type RequestContext, SessionState } from '../context/request-context';
import { readCookie } from './request-client';
import { SessionAuthenticator, SessionLookup } from './session-authenticator';
import { SessionCookies } from './session-cookies';

/**
 * Resolves the session cookie into a principal. Never rejects — authorisation decides. A cookie
 * that no longer names a live session is cleared, so the browser stops sending it (a signed-out
 * `/` then opens the landing page instead of the app).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessionAuthenticator: SessionAuthenticator,
    private readonly config: AppConfigService,
    private readonly cls: ClsService<RequestContext>,
    private readonly sessionCookies: SessionCookies,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readCookie(request, this.config.get('SESSION_COOKIE_NAME'));
    if (!token) {
      this.cls.set('sessionState', SessionState.NONE);
      return true;
    }
    const authentication = await this.sessionAuthenticator.authenticate(token);
    if (authentication.result === SessionLookup.VALID) {
      this.cls.set('principal', authentication.principal);
      this.cls.set('sessionState', SessionState.VALID);
    } else {
      this.cls.set('sessionState', SessionState.EXPIRED);
      this.sessionCookies.clear(context.switchToHttp().getResponse<Response>());
    }
    return true;
  }
}
