import { SetMetadata } from '@nestjs/common';

export const RateLimitName = {
  LOGIN: 'LOGIN',
  /** Changing one's password: guesses at the current one, per user. */
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  /** Registering a company (an account and an organisation), per IP. */
  REGISTRATION: 'REGISTRATION',
} as const;
export type RateLimitName = (typeof RateLimitName)[keyof typeof RateLimitName];

export const RATE_LIMIT_KEY = 'security:rate-limit';

/** Applies a named limiter to the handler instead of the per-session ceiling. */
export const RateLimit = (name: RateLimitName): MethodDecorator =>
  SetMetadata(RATE_LIMIT_KEY, name);

const MAX_EMAIL_LENGTH = 254;

/** Login attempts are counted per (IP, email); the raw body is read before validation. */
export const loginRateLimitKey = (ip: string, email: unknown): string[] => [
  ip,
  typeof email === 'string' ? email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH) : '',
];
