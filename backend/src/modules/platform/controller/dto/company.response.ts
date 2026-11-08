import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageableOptions } from '../../../../common/dto/pageable';
import { ORGANISATION_STATUSES } from '../../../user/service/organisation-status';
import {
  COMPANY_PEOPLE,
  COMPANY_SORT_FIELDS,
  COMPANY_USER_SORT_FIELDS,
} from '../../service/company-sort';

export const COMPANY_PAGEABLE = pageableOptions({
  sortable: COMPANY_SORT_FIELDS,
  defaultSort: 'createdAt,desc',
});
export const COMPANY_USER_PAGEABLE = pageableOptions({
  sortable: COMPANY_USER_SORT_FIELDS,
  defaultSort: 'name,asc',
});

const CompanyStatusSchema = z.enum(ORGANISATION_STATUSES).meta({ id: 'CompanyStatus' });

const PersonSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
});

export const CompanySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    status: CompanyStatusSchema,
    createdAt: z.iso.datetime(),
    /** The latest approval or rejection; null while it waits for the first decision. */
    decidedAt: z.iso.datetime().nullable(),
    decidedBy: z.object({ firstName: z.string(), lastName: z.string() }).nullable(),
    rejectionReason: z.string().max(500).nullable(),
    /** Up to 3, oldest first. */
    owners: z.array(PersonSchema),
    adminCount: z.number().int().min(0),
    activeEmployeeCount: z.number().int().min(0),
  })
  .meta({ id: 'Company' });

export class CompanyPageResponse extends createZodDto(
  z.object({ content: z.array(CompanySchema), totalElements: z.number().int() }),
) {}

export class CompanyResponse extends createZodDto(z.object(CompanySchema.shape)) {}

export class CompanyCountsResponse extends createZodDto(
  z.object({
    PENDING: z.number().int().min(0),
    ACTIVE: z.number().int().min(0),
    REJECTED: z.number().int().min(0),
  }),
) {}

export const CompanyFilterQuerySchema = z.object({
  status: CompanyStatusSchema.default('PENDING'),
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});
export class CompanyFilterQuery extends createZodDto(CompanyFilterQuerySchema) {}

const CompanyUserSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
    /** TERMINATED: an employee whose employment has ended. */
    status: z.enum(['ACTIVE', 'TERMINATED']),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'CompanyUser' });

export class CompanyUserPageResponse extends createZodDto(
  z.object({ content: z.array(CompanyUserSchema), totalElements: z.number().int() }),
) {}

export const CompanyUserQuerySchema = z.object({
  /** Owners, admins, or employees (managers included); absent → everyone. */
  people: z.enum(COMPANY_PEOPLE).optional(),
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});
export class CompanyUserQuery extends createZodDto(CompanyUserQuerySchema) {}

export const RejectCompanyRequestSchema = z.object({
  reason: z
    .string({ error: 'validation.rejectionReason.required' })
    .trim()
    .min(1, 'validation.rejectionReason.required')
    .max(500, 'validation.rejectionReason.tooLong'),
});
export class RejectCompanyRequest extends createZodDto(RejectCompanyRequestSchema) {}
