import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { USER_ROLES } from '../../../user/service/user-role';

export const UserRoleSchema = z.enum(USER_ROLES).meta({ id: 'UserRole' });

export const CurrentUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  /** The caller's organisation (a user belongs to one). */
  organisation: z.object({ id: z.uuid(), name: z.string().max(100) }),
  /** Minutes without activity after which the session ends (the client warns before). */
  idleTimeoutMinutes: z.number().int().min(1),
});

export class CurrentUserResponse extends createZodDto(CurrentUserResponseSchema) {}
