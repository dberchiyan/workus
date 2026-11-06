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
});

export class CurrentUserResponse extends createZodDto(CurrentUserResponseSchema) {}
