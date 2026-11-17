import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MAX_RESPONSIBLES = 10;

export class UpdateResponsiblesRequest extends createZodDto(
    z.object({
        responsibleUserIds: z
            .array(z.uuid('validation.invalid'))
            .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany'),
        version: z.number().int().min(0),
    }),
) {}
