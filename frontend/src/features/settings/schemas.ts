import { z } from 'zod';

import { newPasswordSchema, PASSWORD_LIMITS } from '@/shared/lib/password-rules';

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

export const NAME_LIMITS = { firstName: 100, lastName: 100 } as const;

export const editNameSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, 'validation:firstName.required')
        .max(NAME_LIMITS.firstName, 'validation:firstName.tooLong'),
    lastName: z
        .string()
        .trim()
        .min(1, 'validation:lastName.required')
        .max(NAME_LIMITS.lastName, 'validation:lastName.tooLong'),
});

export type EditNameValues = z.infer<typeof editNameSchema>;
