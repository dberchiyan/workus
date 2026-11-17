import { graceEndsAt, PLAN_CATALOGUE } from '../../../../common/plan/plan';
import type { UserProfile } from '../../../user/service/user.types';
import type { CurrentUserResponse } from '../dto/current-user.response';

export const toCurrentUserResponse = (
  user: UserProfile,
  idleTimeoutMinutes: number,
  demoRestricted: boolean,
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
    billing: {
      plan: user.organisation.plan,
      features: [...PLAN_CATALOGUE[user.organisation.plan].features],
      maxEmployees: PLAN_CATALOGUE[user.organisation.plan].maxEmployees,
      pastDueUntil: user.organisation.pastDueSince
        ? graceEndsAt(user.organisation.pastDueSince).toISOString()
        : null,
    },
  },
  idleTimeoutMinutes,
  demoRestricted,
});
