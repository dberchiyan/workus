import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const MAX_RESPONSIBLES = 10;

const requiredName = (field: 'firstName' | 'lastName') =>
  z
    .string({ error: `validation.${field}.required` })
    .trim()
    .min(1, `validation.${field}.required`)
    .max(NAME_MAX_LENGTH, `validation.${field}.tooLong`);

/** Optional text: blank → absent; otherwise trimmed and checked by `schema`. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

const text = (max: number, key: string) => z.string().trim().max(max, key);

export const CreateEmployeeRequestSchema = z.object({
  firstName: requiredName('firstName'),
  lastName: requiredName('lastName'),
  /** Work email — also the sign-in email. */
  email: z
    .string({ error: 'validation.workEmail.required' })
    .trim()
    .min(1, 'validation.workEmail.required')
    .max(EMAIL_MAX_LENGTH, 'validation.email.tooLong')
    .pipe(z.email('validation.email.invalid')),
  positionId: z.uuid('validation.position.required'),
  startDate: z.iso.date('validation.startDate.invalid'),
  mobile: optional(
    text(32, 'validation.mobile.invalid').regex(
      /^\+?[0-9][0-9 ()-]{5,30}$/,
      'validation.mobile.invalid',
    ),
  ),
  personalEmail: optional(
    text(EMAIL_MAX_LENGTH, 'validation.email.tooLong').pipe(
      z.email('validation.personalEmail.invalid'),
    ),
  ),
  linkedinUrl: optional(
    text(255, 'validation.linkedin.invalid').regex(
      /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]{2,100}\/?$/,
      'validation.linkedin.invalid',
    ),
  ),
  /** Stored as "@handle". */
  telegram: optional(
    text(33, 'validation.telegram.invalid').regex(
      /^@?[A-Za-z0-9_]{5,32}$/,
      'validation.telegram.invalid',
    ),
  ),
  address: optional(text(500, 'validation.address.tooLong')),
  responsibleUserIds: z
    .array(z.uuid('validation.invalid'))
    .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany')
    .default([]),
});

export class CreateEmployeeRequest extends createZodDto(CreateEmployeeRequestSchema) {}
