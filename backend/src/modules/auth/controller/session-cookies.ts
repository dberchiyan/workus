import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AppConfigService } from '../../../common/config/app-config.service';
import { CSRF_COOKIE_NAME } from '../../../common/security/csrf.guard';
import type { StartedSession } from '../service/session.service';

/** Writes and clears the session and CSRF cookies (security.md → Sessions, CSRF). */
@Injectable()
export class SessionCookies {
  constructor(private readonly config: AppConfigService) {}

  write(response: Response, session: StartedSession): void {
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
