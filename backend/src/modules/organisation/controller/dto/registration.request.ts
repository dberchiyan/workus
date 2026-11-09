import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { personName } from '../../../../common/dto/person-name';
import { NewPasswordSchema } from '../../../../common/dto/password';

export const ORGANISATION_NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;

export const OrganisationNameSchema = z
  .string({ error: 'validation.organisationName.required' })
  .trim()
  .min(1, 'validation.organisationName.required')
  .max(ORGANISATION_NAME_MAX_LENGTH, 'validation.organisationName.tooLong');

export const RegistrationRequestSchema = z.object({
  organisationName: OrganisationNameSchema,
  firstName: personName('firstName'),
  lastName: personName('lastName'),
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
