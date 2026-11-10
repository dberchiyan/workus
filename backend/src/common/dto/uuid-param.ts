import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { InvalidParameterException } from '../exception/api.exception';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID.test(value);

/** A path id; anything but a UUID is 400 INVALID_PARAMETER naming the parameter (api.md). */
export const UuidParam = createParamDecorator((name: string, context: ExecutionContext): string => {
  const value: unknown = Reflect.get(context.switchToHttp().getRequest<Request>().params, name);
  if (!isUuid(value)) {
    throw new InvalidParameterException(name);
  }
  return value.toLowerCase();
});
