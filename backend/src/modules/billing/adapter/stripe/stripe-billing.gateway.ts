import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';

import { AppConfigService } from '../../../../common/config/app-config.service';
import {
    BusinessRuleException,
    UpstreamUnavailableException,
    WebhookSignatureException,
} from '../../../../common/exception/api.exception';
import { MetricsService } from '../../../../common/observability/metrics.service';
import { type Plan, Plan as PlanValue } from '../../../../common/plan/plan';
import { MS_PER_SECOND } from '../../../../common/time/units';
import {
    BillingGateway,
    type CheckoutRequest,
    type NewCustomer,
    type ProviderSubscription,
    SubscriptionState,
    type WebhookEvent,
} from '../../service/billing-gateway';

const TIMEOUT_MS = 10_000;
const MAX_NETWORK_RETRIES = 2;
const SIGNATURE_TOLERANCE_SECONDS = 300;
const PROVIDER = 'stripe';

const STATE_OF: Record<Stripe.Subscription.Status, SubscriptionState> = {
    active: SubscriptionState.ACTIVE,
    trialing: SubscriptionState.ACTIVE,
    past_due: SubscriptionState.PAST_DUE,
    unpaid: SubscriptionState.PAST_DUE,
    incomplete: SubscriptionState.PENDING,
    incomplete_expired: SubscriptionState.ENDED,
    canceled: SubscriptionState.ENDED,
    paused: SubscriptionState.ENDED,
};

/** Statuses Stripe may add later count as ended: a plan is never isGrantedPlan by accident. */
const stateOf = (status: Stripe.Subscription.Status): SubscriptionState => STATE_OF[status] ?? SubscriptionState.ENDED;

const idOf = (value: string | { id: string } | null | undefined): string | null =>
    value === null || value === undefined ? null : typeof value === 'string' ? value : value.id;

const toDate = (seconds: number | null | undefined): Date | null =>
    seconds === null || seconds === undefined ? null : new Date(seconds * MS_PER_SECOND);

/**
 * Stripe behind the BillingGateway port: Checkout for the first payment, the Customer Portal for
 * everything after, subscriptions read back as the truth, webhooks verified over the raw body.
 * Stripe's types, ids and errors stay in this file (integrations.md → Provider boundary).
 */
@Injectable()
export class StripeBillingGateway extends BillingGateway {
    private readonly stripe: Stripe;
    private readonly webhookSecret: string;
    private readonly portalConfiguration: string | undefined;
    private readonly priceOfPlan: Partial<Record<Plan, string>>;
    readonly isTestMode: boolean;

    constructor(
        config: AppConfigService,
        private readonly metrics: MetricsService,
        @InjectPinoLogger(StripeBillingGateway.name) private readonly logger: PinoLogger,
    ) {
        super();
        const secretKey = config.get('STRIPE_SECRET_KEY') ?? '';
        this.stripe = new Stripe(secretKey, {
            timeout: TIMEOUT_MS,
            maxNetworkRetries: MAX_NETWORK_RETRIES,
            appInfo: { name: 'Workus' },
        });
        this.webhookSecret = config.get('STRIPE_WEBHOOK_SECRET') ?? '';
        this.portalConfiguration = config.get('STRIPE_PORTAL_CONFIGURATION');
        this.priceOfPlan = {
            [PlanValue.TEAM]: config.get('STRIPE_PRICE_TEAM'),
            [PlanValue.BUSINESS]: config.get('STRIPE_PRICE_BUSINESS'),
        };
        this.isTestMode = config.isBillingTestMode;
    }

    async createCustomer(customer: NewCustomer): Promise<string> {
        const created = await this.call('customers.create', () =>
            this.stripe.customers.create(
                {
                    name: customer.name,
                    email: customer.email,
                    metadata: { organisationId: customer.organisationId },
                },
                { idempotencyKey: `customer-${customer.organisationId}` },
            ),
        );
        return created.id;
    }

    async createCheckoutSession(request: CheckoutRequest): Promise<{ url: string }> {
        const price = this.priceOfPlan[request.plan];
        if (!price) {
            throw new BusinessRuleException('errors.billing.notPurchasable');
        }
        const session = await this.call('checkout.sessions.create', () =>
            this.stripe.checkout.sessions.create(
                {
                    mode: 'subscription',
                    customer: request.customerId,
                    line_items: [{ price, quantity: 1 }],
                    success_url: request.successUrl,
                    cancel_url: request.cancelUrl,
                    client_reference_id: request.organisationId,
                    subscription_data: { metadata: { organisationId: request.organisationId } },
                },
                { idempotencyKey: request.idempotencyKey },
            ),
        );
        if (!session.url) {
            throw new UpstreamUnavailableException();
        }
        return { url: session.url };
    }

    async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
        const session = await this.call('billingPortal.sessions.create', () =>
            this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
                ...(this.portalConfiguration ? { configuration: this.portalConfiguration } : {}),
            }),
        );
        return { url: session.url };
    }

    async findSubscription(subscriptionId: string): Promise<ProviderSubscription | null> {
        try {
            const subscription = await this.call('subscriptions.retrieve', () =>
                this.stripe.subscriptions.retrieve(subscriptionId, { expand: ['schedule'] }),
            );
            return this.toSubscription(subscription);
        } catch (error) {
            if (error instanceof BusinessRuleException) {
                return null;
            }
            throw error;
        }
    }

    async findLatestSubscription(customerId: string): Promise<ProviderSubscription | null> {
        const list = await this.call('subscriptions.list', () =>
            this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                limit: 10,
                expand: ['data.schedule'],
            }),
        );
        const subscriptions = [...list.data].sort((left, right) => right.created - left.created);
        const RUNNING: readonly SubscriptionState[] = [SubscriptionState.ACTIVE, SubscriptionState.PAST_DUE];
        const running = subscriptions.find((subscription) => RUNNING.includes(stateOf(subscription.status)));
        const chosen = running ?? subscriptions[0];
        return chosen ? this.toSubscription(chosen) : null;
    }

    async cancelSubscription(subscriptionId: string): Promise<ProviderSubscription> {
        const subscription = await this.call('subscriptions.cancel', () =>
            this.stripe.subscriptions.cancel(subscriptionId),
        );
        return this.toSubscription(subscription);
    }

    async changePlan(subscriptionId: string, plan: Plan, when: 'now' | 'period_end'): Promise<ProviderSubscription> {
        const price = this.priceOfPlan[plan];
        if (!price) {
            throw new BusinessRuleException('errors.billing.notPurchasable');
        }
        const subscription = await this.resetPending(subscriptionId);
        const item = subscription.items.data[0];
        if (!item) {
            throw new UpstreamUnavailableException();
        }
        if (when === 'now') {
            await this.call('subscriptions.update', () =>
                this.stripe.subscriptions.update(subscriptionId, {
                    items: [{ id: item.id, price }],
                    proration_behavior: 'always_invoice',
                    payment_behavior: 'error_if_incomplete',
                }),
            );
        } else {
            const schedule = await this.call('subscriptionSchedules.create', () =>
                this.stripe.subscriptionSchedules.create({ from_subscription: subscriptionId }),
            );
            const current = schedule.phases[0];
            if (!current) {
                throw new UpstreamUnavailableException();
            }
            await this.call('subscriptionSchedules.update', () =>
                this.stripe.subscriptionSchedules.update(schedule.id, {
                    end_behavior: 'release',
                    phases: [
                        {
                            start_date: current.start_date,
                            end_date: current.end_date,
                            items: current.items.map((phaseItem) => ({
                                price: idOf(phaseItem.price) ?? price,
                                quantity: phaseItem.quantity ?? 1,
                            })),
                        },
                        { items: [{ price, quantity: 1 }] },
                    ],
                }),
            );
        }
        return this.requireSubscription(subscriptionId);
    }

    async isEndingAtPeriodEnd(subscriptionId: string): Promise<ProviderSubscription> {
        await this.resetPending(subscriptionId);
        await this.call('subscriptions.update', () =>
            this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true }),
        );
        return this.requireSubscription(subscriptionId);
    }

    async keepPlan(subscriptionId: string): Promise<ProviderSubscription> {
        await this.resetPending(subscriptionId);
        return this.requireSubscription(subscriptionId);
    }

    /** Releases a schedule and clears a pending cancellation; answers the subscription as it is. */
    private async resetPending(subscriptionId: string): Promise<Stripe.Subscription> {
        let subscription = await this.call('subscriptions.retrieve', () =>
            this.stripe.subscriptions.retrieve(subscriptionId),
        );
        const scheduleId = idOf(subscription.schedule);
        if (scheduleId) {
            await this.call('subscriptionSchedules.release', () =>
                this.stripe.subscriptionSchedules.release(scheduleId),
            );
        }
        if (subscription.cancel_at_period_end) {
            subscription = await this.call('subscriptions.update', () =>
                this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false }),
            );
        }
        return subscription;
    }

    private async requireSubscription(subscriptionId: string): Promise<ProviderSubscription> {
        const subscription = await this.findSubscription(subscriptionId);
        if (!subscription) {
            throw new UpstreamUnavailableException();
        }
        return subscription;
    }

    parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookEvent {
        if (!signature) {
            this.metrics.webhookSignatureFailures.inc({ provider: PROVIDER });
            throw new WebhookSignatureException();
        }
        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.webhookSecret,
                SIGNATURE_TOLERANCE_SECONDS,
            );
        } catch (error) {
            this.metrics.webhookSignatureFailures.inc({ provider: PROVIDER });
            this.logger.warn({ err: error }, 'Webhook signature refused');
            throw new WebhookSignatureException();
        }
        return {
            id: event.id,
            type: event.type,
            occurredAt: new Date(event.created * MS_PER_SECOND),
            ...this.referencesOf(event),
        };
    }

    /** The subscription and customer an event is about, by its object type. */
    private referencesOf(event: Stripe.Event): Pick<WebhookEvent, 'subscriptionId' | 'customerId'> {
        const object = event.data.object;
        switch (object.object) {
            case 'subscription':
                return { subscriptionId: object.id, customerId: idOf(object.customer) };
            case 'invoice':
                return {
                    subscriptionId: idOf(object.parent?.subscription_details?.subscription),
                    customerId: idOf(object.customer),
                };
            case 'checkout.session':
                return { subscriptionId: idOf(object.subscription), customerId: idOf(object.customer) };
            default:
                return { subscriptionId: null, customerId: null };
        }
    }

    private toSubscription(subscription: Stripe.Subscription): ProviderSubscription {
        const item = subscription.items.data[0];
        return {
            id: subscription.id,
            customerId: idOf(subscription.customer) ?? '',
            state: stateOf(subscription.status),
            plan: this.planOfPrice(item ? idOf(item.price) : null),
            periodEndsAt: toDate(item?.current_period_end),
            isEndingAtPeriodEnd: subscription.cancel_at_period_end,
            scheduledPlan: this.scheduledPlanOf(subscription),
        };
    }

    /** The plan of the phase after the current one, when the portal scheduled a change. */
    private scheduledPlanOf(subscription: Stripe.Subscription): Plan | null {
        const schedule = subscription.schedule;
        if (!schedule || typeof schedule === 'string') {
            return null;
        }
        const now = Math.floor(Date.now() / MS_PER_SECOND);
        const next = schedule.phases.find((phase) => phase.start_date > now);
        const price = next?.items[0]?.price;
        return price ? this.planOfPrice(idOf(price)) : null;
    }

    private planOfPrice(priceId: string | null): Plan | null {
        if (!priceId) {
            return null;
        }
        const entry = Object.entries(this.priceOfPlan).find(([, price]) => price === priceId);
        if (!entry) {
            this.logger.warn({ priceId }, 'Subscription price is not one of the configured plans');
            return null;
        }
        return entry[0] as Plan;
    }

    /** One wrapper for every call: metric by outcome, log with Stripe's request id, our errors. */
    private async call<T>(operation: string, request: () => Promise<T>): Promise<T> {
        try {
            const result = await request();
            this.metrics.billingProviderCalls.inc({ operation, outcome: 'ok' });
            return result;
        } catch (error) {
            this.metrics.billingProviderCalls.inc({ operation, outcome: 'error' });
            const requestId = error instanceof Stripe.errors.StripeError ? error.requestId : undefined;
            this.logger.warn({ operation, requestId, err: error }, 'Stripe call failed');
            throw this.toException(error);
        }
    }

    private toException(error: unknown): Error {
        if (
            error instanceof Stripe.errors.StripeInvalidRequestError ||
            error instanceof Stripe.errors.StripeCardError ||
            error instanceof Stripe.errors.StripeIdempotencyError
        ) {
            return new BusinessRuleException('errors.billing.providerRejected');
        }
        return new UpstreamUnavailableException();
    }
}
