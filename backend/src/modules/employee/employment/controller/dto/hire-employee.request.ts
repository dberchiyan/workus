import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { personName } from '../../../../../common/dto/person-name';
import { AmountInputSchema } from '../../../../../common/dto/money';

export const EMAIL_MAX_LENGTH = 254;
export const MAX_RESPONSIBLES = 10;
/** Mirrored by ck_employees_date_of_birth. */
const MIN_DATE_OF_BIRTH = '1900-01-01';

/** Optional text: blank → absent; otherwise trimmed and checked by `schema`. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

const text = (max: number, key: string) => z.string().trim().max(max, key);

export const CreateEmployeeRequestSchema = z.object({
  firstName: personName('firstName'),
  lastName: personName('lastName'),
  /** Work email — also the sign-in email. */
  email: z
    .string({ error: 'validation.workEmail.required' })
    .trim()
    .min(1, 'validation.workEmail.required')
    .max(EMAIL_MAX_LENGTH, 'validation.email.tooLong')
    .pipe(z.email('validation.email.invalid')),
  positionId: z.uuid('validation.position.required'),
  startDate: z.iso.date('validation.startDate.invalid'),
  /** Starting monthly salary in USD — recorded as the employee's first (starting) review. */
  startingSalary: z
    .string({ error: 'validation.startingSalary.required' })
    .trim()
    .min(1, 'validation.startingSalary.required')
    .pipe(AmountInputSchema),
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
  /** Optional; from 1900-01-01 up to today (the server's UTC date). */
  dateOfBirth: optional(
    z.iso
      .date('validation.dateOfBirth.invalid')
      .refine((value) => value >= MIN_DATE_OF_BIRTH, 'validation.dateOfBirth.invalid')
      .refine(
        (value) => value <= new Date().toISOString().slice(0, 10),
        'validation.dateOfBirth.inFuture',
      ),
  ),
  responsibleUserIds: z
    .array(z.uuid('validation.invalid'))
    .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany')
    .default([]),
});

export class CreateEmployeeRequest extends createZodDto(CreateEmployeeRequestSchema) {}

/**
 * Edit the profile: the same fields as when adding, without responsibles (edited on their own)
 * and the starting salary (edited as its review). An absent contact clears it.
 */
export class UpdateEmployeeRequest extends createZodDto(
  CreateEmployeeRequestSchema.omit({ responsibleUserIds: true, startingSalary: true }).extend({
    /** The version the client read; a stale one is 409 CONCURRENT_MODIFICATION. */
    version: z.number().int().min(0),
  }),
) {}
