import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { BusinessRuleException, WebhookSignatureException } from '../../../../common/exception/api.exception';
import { DAY_MS } from '../../../../common/time/units';
import {
    BillingGateway,
    type CheckoutRequest,
    type NewCustomer,
    type ProviderSubscription,
    SubscriptionState,
    type WebhookEvent,
} from '../../service/billing-gateway';

/** A fake month, so "next charge" shows a date. */
const FAKE_PERIOD_DAYS = 30;
const PERIOD_MS = FAKE_PERIOD_DAYS * DAY_MS;

/**
 * Local work without Stripe (BILLING_PROVIDER=fake): a checkout "pays" at once and sends the
 * browser straight to the success page, where the app re-reads the subscription; the portal
 * only returns. Nothing persists across restarts. The in-memory map is the one deliberate
 * mutable field on a provider — this adapter never runs in production (the env schema demands
 * Stripe's keys there is a deploy decision, see .env.example).
 */
@Injectable()
export class FakeBillingGateway extends BillingGateway {
    /** No card is ever asked for, so there is no test card to name. */
    readonly isTestMode = false;
    private readonly subscriptions = new Map<string, ProviderSubscription>();

    createCustomer(customer: NewCustomer): Promise<string> {
        return Promise.resolve(`fake_cus_${customer.organisationId}`);
    }

    createCheckoutSession(request: CheckoutRequest): Promise<{ url: string }> {
        const subscription: ProviderSubscription = {
            id: `fake_sub_${randomUUID()}`,
            customerId: request.customerId,
            state: SubscriptionState.ACTIVE,
            plan: request.plan,
            periodEndsAt: new Date(Date.now() + PERIOD_MS),
            isEndingAtPeriodEnd: false,
            scheduledPlan: null,
        };
        this.subscriptions.set(subscription.id, subscription);
        return Promise.resolve({ url: request.successUrl });
    }

    createPortalSession(_customerId: string, returnUrl: string): Promise<{ url: string }> {
        return Promise.resolve({ url: returnUrl });
    }

    findSubscription(subscriptionId: string): Promise<ProviderSubscription | null> {
        return Promise.resolve(this.subscriptions.get(subscriptionId) ?? this.restore(subscriptionId));
    }

    /**
     * Nothing persists across restarts, but the database still names the subscription: a fake id
     * it no longer knows is restored as a running one with no plan of its own (the company keeps
     * the plan it has), so a deploy never throws the demo back to Starter. Other ids are gone.
     */
    private restore(subscriptionId: string): ProviderSubscription | null {
        if (!subscriptionId.startsWith('fake_sub_')) {
            return null;
        }
        const restored: ProviderSubscription = {
            id: subscriptionId,
            customerId: '',
            state: SubscriptionState.ACTIVE,
            plan: null,
            periodEndsAt: new Date(Date.now() + PERIOD_MS),
            isEndingAtPeriodEnd: false,
            scheduledPlan: null,
        };
        this.subscriptions.set(subscriptionId, restored);
        return restored;
    }

    findLatestSubscription(customerId: string): Promise<ProviderSubscription | null> {
        const own = [...this.subscriptions.values()].filter((subscription) => subscription.customerId === customerId);
        return Promise.resolve(own.at(-1) ?? null);
    }

    changePlan(
        subscriptionId: string,
        plan: ProviderSubscription['plan'],
        when: 'now' | 'period_end',
    ): Promise<ProviderSubscription> {
        const current = this.require(subscriptionId);
        const next: ProviderSubscription =
            when === 'now'
                ? { ...current, plan, isEndingAtPeriodEnd: false, scheduledPlan: null }
                : { ...current, isEndingAtPeriodEnd: false, scheduledPlan: plan };
        this.subscriptions.set(subscriptionId, next);
        return Promise.resolve(next);
    }

    isEndingAtPeriodEnd(subscriptionId: string): Promise<ProviderSubscription> {
        const next = { ...this.require(subscriptionId), isEndingAtPeriodEnd: true, scheduledPlan: null };
        this.subscriptions.set(subscriptionId, next);
        return Promise.resolve(next);
    }

    keepPlan(subscriptionId: string): Promise<ProviderSubscription> {
        const next = { ...this.require(subscriptionId), isEndingAtPeriodEnd: false, scheduledPlan: null };
        this.subscriptions.set(subscriptionId, next);
        return Promise.resolve(next);
    }

    private require(subscriptionId: string): ProviderSubscription {
        const subscription = this.subscriptions.get(subscriptionId) ?? this.restore(subscriptionId);
        if (!subscription) {
            throw new BusinessRuleException('errors.billing.noSubscription');
        }
        return subscription;
    }

    cancelSubscription(subscriptionId: string): Promise<ProviderSubscription> {
        const existing = this.subscriptions.get(subscriptionId);
        const ended: ProviderSubscription = {
            id: subscriptionId,
            customerId: existing?.customerId ?? '',
            state: SubscriptionState.ENDED,
            plan: existing?.plan ?? null,
            periodEndsAt: null,
            isEndingAtPeriodEnd: false,
            scheduledPlan: null,
        };
        this.subscriptions.set(subscriptionId, ended);
        return Promise.resolve(ended);
    }

    parseWebhook(): WebhookEvent {
        // The fake sends no webhooks, so none can be genuine.
        throw new WebhookSignatureException();
    }
}
