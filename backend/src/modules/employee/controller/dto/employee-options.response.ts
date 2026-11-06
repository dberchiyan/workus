import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { USER_ROLES } from '../../../user/service/user-role';

export class PositionOptionsResponse extends createZodDto(
  z.object({
    content: z.array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        category: z.object({ id: z.uuid(), name: z.string() }),
      }),
    ),
  }),
) {}

export class ResponsibleCandidatesResponse extends createZodDto(
  z.object({
    content: z.array(
      z.object({
        id: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        role: z.enum(USER_ROLES),
        positionTitle: z.string().nullable(),
      }),
    ),
  }),
) {}

export const ResponsibleCandidateQuerySchema = z.object({
  search: z.string().trim().max(100, 'validation.search.tooLong').optional(),
});

export class ResponsibleCandidateQuery extends createZodDto(ResponsibleCandidateQuerySchema) {}
