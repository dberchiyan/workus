import { z } from 'zod';

/** Mirrors backend NewPasswordSchema (common/dto/password.ts). */
export const PASSWORD_LIMITS = { min: 12, max: 128 } as const;

/** The rules a new password meets — checked live in the rules box and on submit. */
export const PASSWORD_RULES = [
  {
    key: 'length',
    test: (value: string) =>
      value.length >= PASSWORD_LIMITS.min && value.length <= PASSWORD_LIMITS.max,
  },
  { key: 'uppercase', test: (value: string) => /\p{Lu}/u.test(value) },
  { key: 'lowercase', test: (value: string) => /\p{Ll}/u.test(value) },
  { key: 'digit', test: (value: string) => /\p{Nd}/u.test(value) },
  { key: 'symbol', test: (value: string) => /[^\p{L}\p{Nd}\s]/u.test(value) },
] as const;

/** A new password field (registration, password change); messages are i18n keys. */
export const newPasswordSchema = z
  .string()
  .min(1, 'validation:newPassword.required')
  .min(PASSWORD_LIMITS.min, 'validation:newPassword.tooShort')
  .max(PASSWORD_LIMITS.max, 'validation:password.tooLong')
  .regex(/\p{Lu}/u, 'validation:newPassword.needsUppercase')
  .regex(/\p{Ll}/u, 'validation:newPassword.needsLowercase')
  .regex(/\p{Nd}/u, 'validation:newPassword.needsDigit')
  .regex(/[^\p{L}\p{Nd}\s]/u, 'validation:newPassword.needsSymbol');
