import type { Plan } from '../../../common/plan/plan';

export const SubscriptionState = {
    ACTIVE: 'ACTIVE',
    PAST_DUE: 'PAST_DUE',
    PENDING: 'PENDING',
    ENDED: 'ENDED',
} as const;
export type SubscriptionState = (typeof SubscriptionState)[keyof typeof SubscriptionState];

export interface ProviderSubscription {
    id: string;
    customerId: string;
    state: SubscriptionState;
    plan: Plan | null;
    periodEndsAt: Date | null;
    isEndingAtPeriodEnd: boolean;
    scheduledPlan: Plan | null;
}

export interface NewCustomer {
    organisationId: string;
    name: string;
    email: string;
}

export interface CheckoutRequest {
    organisationId: string;
    customerId: string;
    plan: Plan;
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
}

export interface WebhookEvent {
    id: string;
    type: string;
    occurredAt: Date;
    subscriptionId: string | null;
    customerId: string | null;
}

export abstract class BillingGateway {
    abstract readonly isTestMode: boolean;
    abstract createCustomer(customer: NewCustomer): Promise<string>;
    abstract createCheckoutSession(request: CheckoutRequest): Promise<{ url: string }>;
    abstract createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
    abstract findSubscription(subscriptionId: string): Promise<ProviderSubscription | null>;
    abstract findLatestSubscription(customerId: string): Promise<ProviderSubscription | null>;
    abstract cancelSubscription(subscriptionId: string): Promise<ProviderSubscription>;

    abstract changePlan(subscriptionId: string, plan: Plan, when: 'now' | 'period_end'): Promise<ProviderSubscription>;

    abstract isEndingAtPeriodEnd(subscriptionId: string): Promise<ProviderSubscription>;

    abstract keepPlan(subscriptionId: string): Promise<ProviderSubscription>;

    abstract parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookEvent;
}
