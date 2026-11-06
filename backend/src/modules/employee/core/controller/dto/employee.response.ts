import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageResponseSchema } from '../../../../../common/dto/page.response';
import { EmployeeStatusSchema } from './employee-filter.query';

const PersonSchema = z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() });

export const EmployeeListItemSchema = z
  .object({
    id: z.uuid(),
    /** The person's user id — stable across screens (e.g. avatar colour, responsibles). */
    userId: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    position: z.object({
      id: z.uuid(),
      title: z.string(),
      category: z.object({ id: z.uuid(), name: z.string() }),
    }),
    /** Up to three; `responsibleCount` is the total. */
    responsibles: z.array(PersonSchema),
    responsibleCount: z.number().int().min(0),
    startDate: z.iso.date(),
    terminatedOn: z.iso.date().nullable(),
    status: EmployeeStatusSchema,
  })
  .meta({ id: 'EmployeeListItem' });

export class EmployeePageResponse extends createZodDto(
  pageResponseSchema(EmployeeListItemSchema),
) {}

export class EmployeeSummaryResponse extends createZodDto(
  z.object({
    totalActive: z.number().int().min(0),
    newLast30Days: z.number().int().min(0),
    terminatedLast90Days: z.number().int().min(0),
    /** Mean whole days since start over active employees. */
    averageTenureDays: z.number().int().min(0),
    withoutResponsible: z.number().int().min(0),
  }),
) {}

export class PositionCategoryCountsResponse extends createZodDto(
  z.object({
    total: z.number().int().min(0),
    categories: z.array(
      z.object({ id: z.uuid(), name: z.string(), employeeCount: z.number().int().min(0) }),
    ),
  }),
) {}
