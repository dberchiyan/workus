import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** At most as many as on an employee; at least one, or nobody could decide. */
const MAX_RESPONSIBLES = 10;

export const UpdateRequestResponsiblesRequestSchema = z.object({
  responsibleUserIds: z
    .array(z.uuid('validation.invalid'))
    .min(1, 'validation.responsibles.required')
    .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany'),
});

export class UpdateRequestResponsiblesRequest extends createZodDto(
  UpdateRequestResponsiblesRequestSchema,
) {}
