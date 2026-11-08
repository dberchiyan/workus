import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const IDEMPOTENT_KEY = 'idempotency:required';
export const IDEMPOTENCY_REDACT_KEY = 'idempotency:redact';
export const IDEMPOTENCY_EXEMPT_KEY = 'idempotency:exempt';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export interface IdempotentOptions {
  /**
   * Top-level response fields never stored for replay (secrets shown once, e.g. a generated
   * password): a replay answers them as null.
   */
  redact?: readonly string[];
}

/** Side-effecting POST: requires an Idempotency-Key and replays the stored response on retry. */
export const Idempotent = (options: IdempotentOptions = {}): MethodDecorator =>
  applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
    SetMetadata(IDEMPOTENCY_REDACT_KEY, options.redact ?? []),
    ApiHeader({
      name: IDEMPOTENCY_HEADER,
      required: true,
      description: 'UUID per logical operation, reused on retry',
      schema: { type: 'string', format: 'uuid' },
    }),
  );

/** A POST that is safe to repeat without a key; `reason` says why, next to the handler. */
export const IdempotencyExempt = (reason: string): MethodDecorator =>
  SetMetadata(IDEMPOTENCY_EXEMPT_KEY, reason);
