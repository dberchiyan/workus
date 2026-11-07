import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from './login.request';

/** Password rules (product decision): length plus upper- and lower-case letters, a digit and a symbol. */
export const PASSWORD_MIN_LENGTH = 12;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z
    .string({ error: 'validation.currentPassword.required' })
    .min(1, 'validation.currentPassword.required')
    .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong'),
  newPassword: z
    .string({ error: 'validation.newPassword.required' })
    .min(PASSWORD_MIN_LENGTH, 'validation.newPassword.tooShort')
    .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong')
    .regex(/\p{Lu}/u, 'validation.newPassword.needsUppercase')
    .regex(/\p{Ll}/u, 'validation.newPassword.needsLowercase')
    .regex(/\p{Nd}/u, 'validation.newPassword.needsDigit')
    .regex(/[^\p{L}\p{Nd}\s]/u, 'validation.newPassword.needsSymbol'),
});

export class ChangePasswordRequest extends createZodDto(ChangePasswordRequestSchema) {}
