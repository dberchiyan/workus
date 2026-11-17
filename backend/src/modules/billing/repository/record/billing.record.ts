import type { Prisma } from '../../../../generated/prisma/client';

export const organisationBillingSelect = {
    id: true,
    name: true,
    plan: true,
    subscriptionStatus: true,
    scheduledPlan: true,
    currentPeriodEnd: true,
    pastDueSince: true,
    billingCustomerId: true,
    billingSubscriptionId: true,
} satisfies Prisma.OrganisationSelect;
export type OrganisationBillingRecord = Prisma.OrganisationGetPayload<{
    select: typeof organisationBillingSelect;
}>;

export const billingEventSelect = {
    id: true,
    providerEventId: true,
    type: true,
    occurredAt: true,
    organisationId: true,
    subscriptionId: true,
    customerId: true,
    processedAt: true,
} satisfies Prisma.BillingEventSelect;
export type BillingEventRecord = Prisma.BillingEventGetPayload<{
    select: typeof billingEventSelect;
}>;
