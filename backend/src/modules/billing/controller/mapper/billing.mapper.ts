import type { BillingSummary } from '../../service/billing.types';
import type { BillingResponse } from '../dto/billing.response';

export const toBillingResponse = (summary: BillingSummary): BillingResponse => ({
    plan: summary.plan,
    status: summary.status,
    scheduledPlan: summary.scheduledPlan,
    currentPeriodEnd: summary.currentPeriodEnd?.toISOString() ?? null,
    pastDueSince: summary.pastDueSince?.toISOString() ?? null,
    graceEndsAt: summary.graceEndsAt?.toISOString() ?? null,
    canManage: summary.canManage,
    granted: summary.granted,
    testMode: summary.testMode,
    plans: summary.plans.map((offer) => ({
        plan: offer.plan,
        name: offer.name,
        monthlyPrice: { amount: offer.monthlyPriceUsd, currency: 'USD' },
        maxEmployees: offer.maxEmployees,
        features: [...offer.features],
    })),
});
