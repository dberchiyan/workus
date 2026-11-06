import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error.response';
import { ErrorCode } from './error-code';

/** Documents the error responses a handler can return. */
export const ApiErrors = (...codes: ErrorCode[]): MethodDecorator & ClassDecorator => {
  const byStatus = new Map<number, ErrorCode[]>();
  for (const code of codes) {
    const status = ErrorCode[code];
    byStatus.set(status, [...(byStatus.get(status) ?? []), code]);
  }
  return applyDecorators(
    ...[...byStatus.entries()].map(([status, statusCodes]) =>
      ApiResponse({ status, description: statusCodes.join(' | '), type: ErrorResponse }),
    ),
  );
};
