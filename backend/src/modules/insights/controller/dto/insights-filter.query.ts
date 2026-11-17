import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MIN_YEAR } from '../../../../common/dto/limits';

export const InsightsFilterQuerySchema = z.object({
    /** A year up to the current one. */
    year: z.coerce
        .number({ error: 'validation.invalid' })
        .int('validation.invalid')
        .min(MIN_YEAR, 'validation.invalid')
        .refine((year) => year <= new Date().getUTCFullYear(), 'validation.invalid'),
    /** One position category; its positions become the groups. */
    categoryId: z.uuid('validation.invalid').optional(),
});

export class InsightsFilterQuery extends createZodDto(InsightsFilterQuerySchema) {}
