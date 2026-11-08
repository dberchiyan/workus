import { z } from 'zod';
import { newPasswordSchema } from '@/shared/lib/passwordRules';

/** Mirrors backend RegistrationRequest (organisation/controller/dto/registration.request.ts). */
export const ORGANISATION_LIMITS = {
  organisationName: 100,
  firstName: 100,
  lastName: 100,
  email: 254,
} as const;

export const organisationNameSchema = z
  .string()
  .trim()
  .min(1, 'validation:organisationName.required')
  .max(ORGANISATION_LIMITS.organisationName, 'validation:organisationName.tooLong');

/** Step 1 — the company. */
export const companyStepSchema = z.object({ organisationName: organisationNameSchema });

/** Step 2 — you, the owner. */
export const ownerStepSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'validation:firstName.required')
    .max(ORGANISATION_LIMITS.firstName, 'validation:firstName.tooLong'),
  lastName: z
    .string()
    .trim()
    .min(1, 'validation:lastName.required')
    .max(ORGANISATION_LIMITS.lastName, 'validation:lastName.tooLong'),
  email: z
    .string()
    .trim()
    .min(1, 'validation:email.required')
    .max(ORGANISATION_LIMITS.email, 'validation:email.tooLong')
    .pipe(z.email('validation:email.invalid')),
  password: newPasswordSchema,
});

export const registrationSchema = companyStepSchema.extend(ownerStepSchema.shape);
export type RegistrationValues = z.input<typeof registrationSchema>;
export type RegistrationOutput = z.output<typeof registrationSchema>;

export const renameSchema = z.object({ name: organisationNameSchema });
export type RenameValues = z.input<typeof renameSchema>;

/** Mirrors backend AddAdministratorRequest. */
export const addAdministratorSchema = z.object({
  firstName: ownerStepSchema.shape.firstName,
  lastName: ownerStepSchema.shape.lastName,
  email: z
    .string()
    .trim()
    .min(1, 'validation:workEmail.required')
    .max(ORGANISATION_LIMITS.email, 'validation:email.tooLong')
    .pipe(z.email('validation:email.invalid')),
});
export type AddAdministratorValues = z.input<typeof addAdministratorSchema>;
export type AddAdministratorOutput = z.output<typeof addAdministratorSchema>;
