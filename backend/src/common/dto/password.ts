import { z } from 'zod';

export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MIN_LENGTH = 12;

export const NewPasswordSchema = z
    .string({ error: 'validation.newPassword.required' })
    .min(PASSWORD_MIN_LENGTH, 'validation.newPassword.tooShort')
    .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong')
    .regex(/\p{Lu}/u, 'validation.newPassword.needsUppercase')
    .regex(/\p{Ll}/u, 'validation.newPassword.needsLowercase')
    .regex(/\p{Nd}/u, 'validation.newPassword.needsDigit')
    .regex(/[^\p{L}\p{Nd}\s]/u, 'validation.newPassword.needsSymbol');
