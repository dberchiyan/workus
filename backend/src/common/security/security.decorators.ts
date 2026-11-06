import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { Policy } from './policy';

export const PUBLIC_KEY = 'security:public';
export const POLICY_KEY = 'security:policy';
export const SESSION_COOKIE_SECURITY = 'session';

/** No session required — login, health, signature-verified webhooks. */
export const Public = (): MethodDecorator => SetMetadata(PUBLIC_KEY, true);

/** Requires a session and a passing policy. */
export const Authorize = (requiredPolicy: Policy): MethodDecorator =>
  applyDecorators(SetMetadata(POLICY_KEY, requiredPolicy), ApiCookieAuth(SESSION_COOKIE_SECURITY));
