import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from '../../../../common/dto/password';

export const EMAIL_MAX_LENGTH = 254;

export const LoginRequestSchema = z.object({
  email: z
    .email({
      error: (issue) =>
        issue.input === undefined ? 'validation.email.required' : 'validation.email.invalid',
    })
    .max(EMAIL_MAX_LENGTH, 'validation.email.tooLong'),
  password: z
    .string({ error: 'validation.password.required' })
    .min(1, 'validation.password.required')
    .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong'),
});

export class LoginRequest extends createZodDto(LoginRequestSchema) {}
