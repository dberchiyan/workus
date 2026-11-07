import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MAX_RESPONSIBLES = 10;

export class UpdateResponsiblesRequest extends createZodDto(
  z.object({
    /** The whole new set (0–10 admins); replaces the current one. */
    responsibleUserIds: z
      .array(z.uuid('validation.invalid'))
      .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany'),
    /** The employee version the client read; a stale one is 409 CONCURRENT_MODIFICATION. */
    version: z.number().int().min(0),
  }),
) {}
