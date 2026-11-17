import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MIN_YEAR } from '../../../../common/dto/limits';

export const InsightsFilterQuerySchema = z.object({
    year: z.coerce
        .number({ error: 'validation.invalid' })
        .int('validation.invalid')
        .min(MIN_YEAR, 'validation.invalid')
        .refine((year) => year <= new Date().getUTCFullYear(), 'validation.invalid'),
    categoryId: z.uuid('validation.invalid').optional(),
});

export class InsightsFilterQuery extends createZodDto(InsightsFilterQuerySchema) {}
