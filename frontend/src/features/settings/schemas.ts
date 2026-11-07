import { z } from 'zod';
import { newPasswordSchema, PASSWORD_LIMITS } from '@/shared/lib/passwordRules';

/** Mirrors backend ChangePasswordRequest (auth/controller/dto/change-password.request.ts). */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'validation:currentPassword.required')
      .max(PASSWORD_LIMITS.max, 'validation:password.tooLong'),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'validation:confirmPassword.required'),
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    path: ['confirmPassword'],
    message: 'validation:confirmPassword.mismatch',
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
