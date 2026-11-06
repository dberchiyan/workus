import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z.object({ status: z.literal('ok') });

export class HealthResponse extends createZodDto(HealthResponseSchema) {}
