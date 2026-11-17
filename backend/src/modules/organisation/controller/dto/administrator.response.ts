import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_TEMPORARY_PASSWORD_LENGTH } from '../../../../common/dto/limits';
import { MAX_SEARCH_LENGTH } from '../../../../common/dto/limits';
import { pageableOptions } from '../../../../common/dto/pageable';
import { personName } from '../../../../common/dto/person-name';
import { ADMINISTRATOR_SORT_FIELDS } from '../../../user/service/administrator-sort';

export const ADMINISTRATOR_PAGEABLE = pageableOptions({
    sortable: ADMINISTRATOR_SORT_FIELDS,
    defaultSort: 'name,asc',
});

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
export class AdministratorResponse extends createZodDto(z.object(AdministratorResponseSchema.shape)) {}

export class AdministratorPageResponse extends createZodDto(
    z.object({
        content: z.array(AdministratorResponseSchema),
        totalElements: z.number().int(),
    }),
) {}

export const AdministratorFilterQuerySchema = z.object({
    search: z.string().trim().max(MAX_SEARCH_LENGTH, 'validation.search.tooLong').optional(),
});

export class AdministratorFilterQuery extends createZodDto(AdministratorFilterQuerySchema) {}

export const ChangeRoleRequestSchema = z.object({
    role: z.enum(['OWNER', 'ADMIN'], { error: 'validation.role.invalid' }),
    version: z.number().int().min(0),
});

export class ChangeRoleRequest extends createZodDto(ChangeRoleRequestSchema) {}

const EMAIL_MAX_LENGTH = 254;

export const AddAdministratorRequestSchema = z.object({
    firstName: personName('firstName'),
    lastName: personName('lastName'),
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
        temporaryPassword: z.string().min(1).max(MAX_TEMPORARY_PASSWORD_LENGTH).nullable(),
    }),
) {}
