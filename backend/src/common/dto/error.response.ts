import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ERROR_CODES } from '../exception/error-code';

export const ErrorCodeSchema = z.enum(ERROR_CODES).meta({ id: 'ErrorCode' });

export const ErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const ErrorResponseSchema = z.object({
  timestamp: z.iso.datetime(),
  status: z.number().int(),
  error: ErrorCodeSchema,
  message: z.string(),
  path: z.string(),
  traceId: z.string(),
  details: z.array(ErrorDetailSchema).optional(),
});

export class ErrorResponse extends createZodDto(ErrorResponseSchema) {}
