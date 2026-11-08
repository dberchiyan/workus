export const ErrorCode = {
  VALIDATION_FAILED: 400,
  MALFORMED_REQUEST: 400,
  INVALID_PARAMETER: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  /** Correct credentials of someone no longer employed. */
  ACCESS_ENDED: 403,
  /** The caller's organisation is not approved (waiting, or rejected): its data is closed. */
  ORGANISATION_NOT_ACTIVE: 403,
  RESOURCE_NOT_FOUND: 404,
  CONFLICT: 409,
  CONCURRENT_MODIFICATION: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  BUSINESS_RULE_VIOLATION: 422,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMIT_EXCEEDED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ErrorCode;

export const ERROR_CODES = Object.keys(ErrorCode) as [ErrorCode, ...ErrorCode[]];
