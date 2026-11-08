import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageableOptions } from '../../../../common/dto/pageable';
import { ADMINISTRATOR_SORT_FIELDS } from '../../../user/service/administrator-sort';

export const ADMINISTRATOR_PAGEABLE = pageableOptions({
  sortable: ADMINISTRATOR_SORT_FIELDS,
  defaultSort: 'name,asc',
});

/** The roles of the people who run an organisation. */
export const AdministratorRoleSchema = z.enum(['OWNER', 'ADMIN']).meta({ id: 'AdministratorRole' });

export const AdministratorResponseSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: AdministratorRoleSchema,
    version: z.number().int(),
  })
  .meta({ id: 'Administrator' });

// A fresh object for the single response: the named schema stays the list item's.
export class AdministratorResponse extends createZodDto(
  z.object(AdministratorResponseSchema.shape),
) {}

export class AdministratorPageResponse extends createZodDto(
  z.object({
    content: z.array(AdministratorResponseSchema),
    totalElements: z.number().int(),
  }),
) {}

export const AdministratorFilterQuerySchema = z.object({
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});

export class AdministratorFilterQuery extends createZodDto(AdministratorFilterQuerySchema) {}

export const ChangeRoleRequestSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN'], { error: 'validation.role.invalid' }),
  version: z.number().int().min(0),
});

export class ChangeRoleRequest extends createZodDto(ChangeRoleRequestSchema) {}

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;

const requiredName = (field: 'firstName' | 'lastName') =>
  z
    .string({ error: `validation.${field}.required` })
    .trim()
    .min(1, `validation.${field}.required`)
    .max(NAME_MAX_LENGTH, `validation.${field}.tooLong`);

/** The role is not a field: an owner always adds an admin (and may make them an owner after). */
export const AddAdministratorRequestSchema = z.object({
  firstName: requiredName('firstName'),
  lastName: requiredName('lastName'),
  /** Work email — the sign-in email; unique across organisations. */
  email: z
    .string({ error: 'validation.workEmail.required' })
    .trim()
    .min(1, 'validation.workEmail.required')
    .max(EMAIL_MAX_LENGTH, 'validation.email.tooLong')
    .pipe(z.email('validation.email.invalid')),
});

export class AddAdministratorRequest extends createZodDto(AddAdministratorRequestSchema) {}

export class AddedAdministratorResponse extends createZodDto(
  z.object({
    ...AdministratorResponseSchema.shape,
    /**
     * The generated sign-in password, shown to the owner this once. Null when the answer is a
     * replay of a retried request — it is never stored, so it cannot be shown again.
     */
    temporaryPassword: z.string().min(1).max(64).nullable(),
  }),
) {}
