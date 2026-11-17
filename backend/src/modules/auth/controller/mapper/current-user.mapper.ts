import { graceEndsAt, PLAN_CATALOGUE } from '../../../../common/plan/plan';
import type { UserProfile } from '../../../user/service/user.types';
import type { CurrentUserResponse } from '../dto/current-user.response';

export const toCurrentUserResponse = (
    user: UserProfile,
    idleTimeoutMinutes: number,
    isDemoRestricted: boolean,
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
            graceEndsAt: user.organisation.pastDueAt ? graceEndsAt(user.organisation.pastDueAt).toISOString() : null,
        },
    },
    idleTimeoutMinutes,
    isDemoRestricted,
});
