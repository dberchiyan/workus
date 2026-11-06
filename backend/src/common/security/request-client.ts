import type { Request } from 'express';

const MAX_USER_AGENT_LENGTH = 512;
const MAX_TOKEN_LENGTH = 128;

/** Client IP as resolved by Express `trust proxy` (TRUST_PROXY_HOPS). */
export const clientIp = (request: Request): string => request.ip ?? 'unknown';

export const clientUserAgent = (request: Request): string | null => {
  const userAgent = request.get('user-agent');
  return userAgent ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null;
};

export const readCookie = (request: Request, name: string): string | undefined => {
  const cookies: unknown = request.cookies;
  if (typeof cookies !== 'object' || cookies === null || !(name in cookies)) {
    return undefined;
  }
  const value: unknown = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TOKEN_LENGTH
    ? value
    : undefined;
};
