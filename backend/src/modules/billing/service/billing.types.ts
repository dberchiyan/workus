import type { Plan, PlanOffer } from '../../../common/plan/plan';
import type { SubscriptionStatus } from './subscription-status';

/** The company's billing state as the owner sees it (Settings → Billing). */
export interface BillingSummary {
  plan: Plan;
  status: SubscriptionStatus;
  scheduledPlan: Plan | null;
  currentPeriodEnd: Date | null;
  pastDueSince: Date | null;
  graceEndsAt: Date | null;
  canManage: boolean;
  granted: boolean;
  testMode: boolean;
  plans: PlanOffer[];
}

export interface EmployeeLimit {
  plan: Plan;
  maxEmployees: number | null;
}
