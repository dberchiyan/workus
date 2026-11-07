import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NewPasswordSchema, PASSWORD_MAX_LENGTH } from '../../../../common/dto/password';

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z
    .string({ error: 'validation.currentPassword.required' })
    .min(1, 'validation.currentPassword.required')
    .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong'),
  newPassword: NewPasswordSchema,
});

export class ChangePasswordRequest extends createZodDto(ChangePasswordRequestSchema) {}
