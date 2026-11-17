import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_SEARCH_LENGTH } from '../../../../common/dto/limits';
import { REQUEST_STATES } from '../../service/time-off-request.criteria';
import { TimeOffStatus } from '../../service/time-off-type';
import { TimeOffTypeSchema } from './create-time-off-request.request';

export const ManagedTimeOffRequestFilterQuerySchema = z.object({
    state: z.enum(REQUEST_STATES, { error: 'validation.invalid' }).default('PENDING'),
    status: z
        .enum([TimeOffStatus.APPROVED, TimeOffStatus.REJECTED, TimeOffStatus.CANCELED], {
            error: 'validation.invalid',
        })
        .optional(),
    type: TimeOffTypeSchema.optional(),
    mine: z
        .enum(['true', 'false'], { error: 'validation.invalid' })
        .optional()
        .transform((value) => value === 'true'),
    search: z.string().trim().max(MAX_SEARCH_LENGTH, 'validation.search.tooLong').optional(),
});

export class ManagedTimeOffRequestFilterQuery extends createZodDto(ManagedTimeOffRequestFilterQuerySchema) {}
