import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { CSRF_COOKIE_NAME } from './csrf.guard';

/** What a started session gives the browser. */
export interface IssuedSession {
  token: string;
  csrfToken: string;
  absoluteExpiresAt: Date;
}

/**
 * Writes and clears the session and CSRF cookies (security.md → Sessions, CSRF) — for every
 * endpoint that starts a session (sign-in, registration).
 */
@Injectable()
export class SessionCookies {
  constructor(private readonly config: AppConfigService) {}

  write(response: Response, session: IssuedSession): void {
    const maxAge = Math.max(0, session.absoluteExpiresAt.getTime() - Date.now());
    response.cookie(this.config.get('SESSION_COOKIE_NAME'), session.token, {
      ...this.baseOptions(),
      httpOnly: true,
      maxAge,
    });
    response.cookie(CSRF_COOKIE_NAME, session.csrfToken, {
      ...this.baseOptions(),
      httpOnly: false,
      maxAge,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.config.get('SESSION_COOKIE_NAME'), {
      ...this.baseOptions(),
      httpOnly: true,
    });
    response.clearCookie(CSRF_COOKIE_NAME, { ...this.baseOptions(), httpOnly: false });
  }

  private baseOptions(): CookieOptions {
    const domain = this.config.get('COOKIE_DOMAIN');
    return {
      secure: this.config.get('COOKIE_SECURE'),
      sameSite: this.config.get('COOKIE_SAME_SITE'),
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }
}
