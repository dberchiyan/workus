import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_TEMPORARY_PASSWORD_LENGTH } from '../../../../../common/dto/limits';

export class PasswordResetResponse extends createZodDto(
    z.object({
        /**
         * The new generated sign-in password, shown to the admin this once. Null when the answer is a
         * replay of a retried request — it is never stored, so it cannot be shown again.
         */
        temporaryPassword: z.string().min(1).max(MAX_TEMPORARY_PASSWORD_LENGTH).nullable(),
    }),
) {}
