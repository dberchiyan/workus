import { useMemo } from 'react';

import { type Plan, PLAN_FOR_FEATURE, type PlanFeature } from '../plan';
import { useAccess } from './use-access';
import { useCurrentUser } from './use-current-user';

export interface CompanyPlan {
    plan: Plan;
    features: readonly PlanFeature[];
    maxEmployees: number | null;
    graceEndsAt: string | null;
    has: (feature: PlanFeature) => boolean;
}

/** The signed-in company's plan — what `/auth/me` says it unlocks. Cosmetic: the API enforces. */
export const usePlan = (): CompanyPlan => {
    const billing = useCurrentUser().data?.organisation.billing;
    return useMemo(() => {
        const features = billing?.features ?? [];
        return {
            plan: billing?.plan ?? 'STARTER',
            features,
            maxEmployees: billing?.maxEmployees ?? null,
            graceEndsAt: billing?.graceEndsAt ?? null,
            has: (feature) => features.includes(feature),
        };
    }, [billing]);
};

export interface UpgradeState {
    locked: boolean;
    requiredPlan: Plan;
    hasBillingAccount: boolean;
}

/** Whether a feature is locked for this company, and what the prompt should say. */
export const useUpgrade = (feature: PlanFeature): UpgradeState => {
    const plan = usePlan();
    const can = useAccess();
    return {
        locked: !plan.has(feature),
        requiredPlan: PLAN_FOR_FEATURE[feature],
        hasBillingAccount: can('settings.billing'),
    };
};
