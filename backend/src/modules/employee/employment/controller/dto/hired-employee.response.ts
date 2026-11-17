import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_TEMPORARY_PASSWORD_LENGTH } from '../../../../../common/dto/limits';

export class HiredEmployeeResponse extends createZodDto(
    z.object({
        id: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
        temporaryPassword: z.string().min(1).max(MAX_TEMPORARY_PASSWORD_LENGTH).nullable(),
    }),
) {}
