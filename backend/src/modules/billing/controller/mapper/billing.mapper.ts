import type { BillingSummary } from '../../service/billing.types';
import type { BillingResponse } from '../dto/billing.response';

export const toBillingResponse = (summary: BillingSummary): BillingResponse => ({
    plan: summary.plan,
    status: summary.status,
    scheduledPlan: summary.scheduledPlan,
    periodEndsAt: summary.periodEndsAt?.toISOString() ?? null,
    pastDueAt: summary.pastDueAt?.toISOString() ?? null,
    graceEndsAt: summary.graceEndsAt?.toISOString() ?? null,
    hasBillingAccount: summary.hasBillingAccount,
    isGrantedPlan: summary.isGrantedPlan,
    isTestMode: summary.isTestMode,
    plans: summary.plans.map((offer) => ({
        plan: offer.plan,
        name: offer.name,
        monthlyPrice: { amount: offer.monthlyPriceUsd, currency: 'USD' },
        maxEmployees: offer.maxEmployees,
        features: [...offer.features],
    })),
});
