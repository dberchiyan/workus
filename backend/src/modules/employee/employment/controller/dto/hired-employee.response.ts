import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class HiredEmployeeResponse extends createZodDto(
  z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    /**
     * The generated sign-in password, shown to the admin this once. Null when the answer is a
     * replay of a retried request — it is never stored, so it cannot be shown again.
     */
    temporaryPassword: z.string().min(1).max(64).nullable(),
  }),
) {}
