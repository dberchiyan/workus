import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NewPasswordSchema } from '../../../../common/dto/password';

export const ORGANISATION_NAME_MAX_LENGTH = 100;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;

export const OrganisationNameSchema = z
  .string({ error: 'validation.organisationName.required' })
  .trim()
  .min(1, 'validation.organisationName.required')
  .max(ORGANISATION_NAME_MAX_LENGTH, 'validation.organisationName.tooLong');

const requiredName = (field: 'firstName' | 'lastName') =>
  z
    .string({ error: `validation.${field}.required` })
    .trim()
    .min(1, `validation.${field}.required`)
    .max(NAME_MAX_LENGTH, `validation.${field}.tooLong`);

export const RegistrationRequestSchema = z.object({
  organisationName: OrganisationNameSchema,
  firstName: requiredName('firstName'),
  lastName: requiredName('lastName'),
  /** Work email — the sign-in email; unique across organisations. */
  email: z
    .string({ error: 'validation.email.required' })
    .trim()
    .min(1, 'validation.email.required')
    .max(EMAIL_MAX_LENGTH, 'validation.email.tooLong')
    .pipe(z.email('validation.email.invalid')),
  password: NewPasswordSchema,
});

export class RegistrationRequest extends createZodDto(RegistrationRequestSchema) {}
