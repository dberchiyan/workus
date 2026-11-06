import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const IDEMPOTENT_KEY = 'idempotency:required';
export const IDEMPOTENCY_EXEMPT_KEY = 'idempotency:exempt';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

/** Side-effecting POST: requires an Idempotency-Key and replays the stored response on retry. */
export const Idempotent = (): MethodDecorator =>
  applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
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
