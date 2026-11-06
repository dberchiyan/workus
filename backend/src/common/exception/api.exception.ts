import type { I18nPath } from '../i18n/i18n-path';
import { ErrorCode } from './error-code';

export type MessageArgs = Readonly<Record<string, string | number>>;

/** Base of every error our code throws. Carries an i18n key, never a message string. */
export abstract class ApiException extends Error {
  readonly status: number;

  protected constructor(
    readonly code: ErrorCode,
    readonly messageKey: I18nPath,
    readonly args: MessageArgs = {},
  ) {
    super(code);
    this.status = ErrorCode[code];
  }
}

export class NotAuthenticatedException extends ApiException {
  constructor() {
    super('UNAUTHORIZED', 'errors.UNAUTHORIZED');
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor() {
    super('INVALID_CREDENTIALS', 'errors.INVALID_CREDENTIALS');
  }
}

export class SessionExpiredException extends ApiException {
  constructor() {
    super('SESSION_EXPIRED', 'errors.SESSION_EXPIRED');
  }
}

export class AccessDeniedException extends ApiException {
  constructor() {
    super('FORBIDDEN', 'errors.FORBIDDEN');
  }
}

export class UnsupportedMediaTypeException extends ApiException {
  constructor() {
    super('UNSUPPORTED_MEDIA_TYPE', 'errors.UNSUPPORTED_MEDIA_TYPE');
  }
}

export class RateLimitExceededException extends ApiException {
  constructor(readonly retryAfterSeconds: number) {
    super('RATE_LIMIT_EXCEEDED', 'errors.RATE_LIMIT_EXCEEDED', {
      minutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
    });
  }
}

export class UpstreamUnavailableException extends ApiException {
  constructor() {
    super('UPSTREAM_UNAVAILABLE', 'errors.UPSTREAM_UNAVAILABLE');
  }
}

export class InvalidParameterException extends ApiException {
  constructor(parameter: string) {
    super('INVALID_PARAMETER', 'errors.INVALID_PARAMETER', { parameter });
  }
}

/** 409 — the request conflicts with existing data; `field` points the client at the input. */
export class BusinessConflictException extends ApiException {
  constructor(
    messageKey: I18nPath,
    args: MessageArgs = {},
    readonly field?: string,
  ) {
    super('CONFLICT', messageKey, args);
  }
}

/** 422 — the request is well-formed but breaks a business rule. */
export class BusinessRuleException extends ApiException {
  constructor(
    messageKey: I18nPath,
    args: MessageArgs = {},
    readonly field?: string,
  ) {
    super('BUSINESS_RULE_VIOLATION', messageKey, args);
  }
}

export class IdempotencyKeyReusedException extends ApiException {
  constructor() {
    super('IDEMPOTENCY_KEY_REUSED', 'errors.IDEMPOTENCY_KEY_REUSED');
  }
}

/** 409 — the same Idempotency-Key is still being processed. */
export class RequestInProgressException extends ApiException {
  constructor() {
    super('CONFLICT', 'errors.CONFLICT');
  }
}
