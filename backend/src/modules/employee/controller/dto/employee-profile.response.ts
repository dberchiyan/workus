import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { USER_ROLES } from '../../../user/service/user-role';
import { EmployeeStatusSchema } from './employee-filter.query';

export class EmployeeProfileResponse extends createZodDto(
  z.object({
    id: z.uuid(),
    userId: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(USER_ROLES),
    position: z.object({
      id: z.uuid(),
      title: z.string(),
      category: z.object({ id: z.uuid(), name: z.string() }),
    }),
    startDate: z.iso.date(),
    terminatedOn: z.iso.date().nullable(),
    status: EmployeeStatusSchema,
    contacts: z.object({
      mobile: z.string().nullable(),
      personalEmail: z.string().nullable(),
      linkedinUrl: z.string().nullable(),
      telegram: z.string().nullable(),
      address: z.string().nullable(),
    }),
    responsibles: z.array(
      z.object({
        id: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        role: z.enum(USER_ROLES),
        positionTitle: z.string().nullable(),
      }),
    ),
    createdAt: z.iso.datetime(),
  }),
) {}
