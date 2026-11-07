import { z } from 'zod';

export const PASSWORD_MAX_LENGTH = 128;
/** Password rules (product decision): length plus upper- and lower-case letters, a digit and a symbol. */
export const PASSWORD_MIN_LENGTH = 12;

/** A new password (registration, password change) — the client shows the same rules live. */
export const NewPasswordSchema = z
  .string({ error: 'validation.newPassword.required' })
  .min(PASSWORD_MIN_LENGTH, 'validation.newPassword.tooShort')
  .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong')
  .regex(/\p{Lu}/u, 'validation.newPassword.needsUppercase')
  .regex(/\p{Ll}/u, 'validation.newPassword.needsLowercase')
  .regex(/\p{Nd}/u, 'validation.newPassword.needsDigit')
  .regex(/[^\p{L}\p{Nd}\s]/u, 'validation.newPassword.needsSymbol');
