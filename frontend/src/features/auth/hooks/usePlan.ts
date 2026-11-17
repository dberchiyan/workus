import { useMemo } from 'react';
import { PLAN_FOR_FEATURE, type Plan, type PlanFeature } from '../plan';
import { useAccess } from './useAccess';
import { useCurrentUser } from './useCurrentUser';

export interface CompanyPlan {
    plan: Plan;
    features: readonly PlanFeature[];
    /** Active employees the plan allows; null = unlimited. */
    maxEmployees: number | null;
    /** A payment failed: the plan stays until then (owners see a banner). */
    pastDueUntil: string | null;
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
            pastDueUntil: billing?.pastDueUntil ?? null,
            has: (feature) => features.includes(feature),
        };
    }, [billing]);
};

export interface UpgradeState {
    /** The plan lacks the feature: show the prompt instead of the feature. */
    locked: boolean;
    requiredPlan: Plan;
    /** The person can open Settings → Billing (owners); others are told to ask an owner. */
    canManage: boolean;
}

/** Whether a feature is locked for this company, and what the prompt should say. */
export const useUpgrade = (feature: PlanFeature): UpgradeState => {
    const plan = usePlan();
    const can = useAccess();
    return {
        locked: !plan.has(feature),
        requiredPlan: PLAN_FOR_FEATURE[feature],
        canManage: can('settings.billing'),
    };
};
