import { z } from 'zod';

/** Mirrors backend LoginRequestSchema (auth/controller/dto/login.request.ts). */
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MAX_LENGTH = 128;
export const LOGIN_FIELD_LIMITS = {
  email: EMAIL_MAX_LENGTH,
  password: PASSWORD_MAX_LENGTH,
} as const;

const MESSAGES = {
  emailRequired: 'validation:email.required',
  emailInvalid: 'validation:email.invalid',
  emailTooLong: 'validation:email.tooLong',
  passwordRequired: 'validation:password.required',
  passwordTooLong: 'validation:password.tooLong',
} as const;

export type LoginValidationMessage = (typeof MESSAGES)[keyof typeof MESSAGES];

const MESSAGE_SET: ReadonlySet<string> = new Set(Object.values(MESSAGES));

export const isLoginValidationMessage = (message: string): message is LoginValidationMessage =>
  MESSAGE_SET.has(message);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, MESSAGES.emailRequired)
    .max(EMAIL_MAX_LENGTH, MESSAGES.emailTooLong)
    .pipe(z.email(MESSAGES.emailInvalid)),
  password: z
    .string()
    .min(1, MESSAGES.passwordRequired)
    .max(PASSWORD_MAX_LENGTH, MESSAGES.passwordTooLong),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;
