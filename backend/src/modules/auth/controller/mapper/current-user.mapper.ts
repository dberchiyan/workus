import type { UserProfile } from '../../../user/service/user.types';
import type { CurrentUserResponse } from '../dto/current-user.response';

export const toCurrentUserResponse = (
  user: UserProfile,
  idleTimeoutMinutes: number,
  demoMode: boolean,
): CurrentUserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  organisation: {
    id: user.organisation.id,
    name: user.organisation.name,
    status: user.organisation.status,
    rejectionReason: user.organisation.rejectionReason,
  },
  idleTimeoutMinutes,
  demoMode,
});
