import type { ErrorCode, ErrorResponse } from '@/shared/types';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

/** Every failed API call surfaces as this — components never parse raw responses. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    override readonly message: string,
    readonly details: readonly ApiErrorDetail[],
    readonly traceId: string | undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(body: ErrorResponse): ApiError {
    return new ApiError(body.status, body.error, body.message, body.details ?? [], body.traceId);
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/** A response that breaks the OpenAPI contract — the same answer would come again. */
export class ApiContractError extends ApiError {
  constructor(status: number, message: string, details: readonly ApiErrorDetail[]) {
    super(status, 'INTERNAL_ERROR', message, details, undefined);
    this.name = 'ApiContractError';
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
