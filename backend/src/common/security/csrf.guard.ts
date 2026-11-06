import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import type { RequestContext } from '../context/request-context';
import { AccessDeniedException } from '../exception/api.exception';
import { tokenMatchesHash } from './token-hash';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_TOKEN_LENGTH = 128;

/**
 * Double-submit check for cookie sessions: the token from the readable XSRF-TOKEN cookie is
 * echoed in X-XSRF-TOKEN and compared with the hash on the session row. Requests without a
 * valid session carry no ambient authority and are not checked — login has no session yet.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly cls: ClsService<RequestContext>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const principal = this.cls.get('principal');
    if (!principal || SAFE_METHODS.has(request.method)) {
      return true;
    }
    const token = request.get(CSRF_HEADER_NAME);
    if (
      !token ||
      token.length > MAX_TOKEN_LENGTH ||
      !tokenMatchesHash(token, principal.csrfTokenHash)
    ) {
      throw new AccessDeniedException();
    }
    return true;
  }
}
