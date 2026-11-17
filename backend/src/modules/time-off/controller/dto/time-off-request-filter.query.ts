import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TimeOffRequestFilterQuerySchema = z.object({
    changedSince: z.iso.datetime({ offset: true, error: 'validation.invalid' }).optional(),
});

export class TimeOffRequestFilterQuery extends createZodDto(TimeOffRequestFilterQuerySchema) {}
