import type { Plan, PlanOffer } from '../../../common/plan/plan';
import type { SubscriptionStatus } from './subscription-status';

export interface BillingSummary {
    plan: Plan;
    status: SubscriptionStatus;
    scheduledPlan: Plan | null;
    periodEndsAt: Date | null;
    pastDueAt: Date | null;
    graceEndsAt: Date | null;
    hasBillingAccount: boolean;
    isGrantedPlan: boolean;
    isTestMode: boolean;
    plans: PlanOffer[];
}

export interface EmployeeLimit {
    plan: Plan;
    maxEmployees: number | null;
}
