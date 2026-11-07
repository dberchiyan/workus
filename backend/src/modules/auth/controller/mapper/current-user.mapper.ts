import type { UserProfile } from '../../../user/service/user.types';
import type { CurrentUserResponse } from '../dto/current-user.response';

export const toCurrentUserResponse = (
  user: UserProfile,
  idleTimeoutMinutes: number,
): CurrentUserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  idleTimeoutMinutes,
});
