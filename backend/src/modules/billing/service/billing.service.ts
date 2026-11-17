import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '../../../common/config/app-config.service';
import { BusinessRuleException, ResourceNotFoundException } from '../../../common/exception/api.exception';
import { MetricsService } from '../../../common/observability/metrics.service';
import {
    GRACE_PERIOD_DAYS,
    graceEndsAt,
    isPaidPlan,
    isPlan,
    Plan,
    PLAN_CATALOGUE,
    PLANS,
} from '../../../common/plan/plan';
import type { Principal } from '../../../common/security/principal';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { AuditService } from '../../audit/service/audit.service';
import { UserService } from '../../user/service/user.service';
import { BillingRepository, type SubscriptionColumns } from '../repository/billing.repository';
import type { OrganisationBillingRecord } from '../repository/record/billing.record';
import { BillingGateway, type ProviderSubscription, SubscriptionState } from './billing-gateway';
import type { BillingSummary, EmployeeLimit } from './billing.types';
import { isSubscriptionStatus, SubscriptionStatus } from './subscription-status';

const DAY_MS = 86_400_000;
const BILLING_PATH = '/settings/billing';
const MAX_GRACE_ENDINGS_PER_RUN = 50;
const MAX_RECONCILED_PER_RUN = 200;
const EVENT_RETENTION_DAYS = 90;

const toPlan = (value: string): Plan => (isPlan(value) ? value : Plan.STARTER);
const toStatus = (value: string): SubscriptionStatus => (isSubscriptionStatus(value) ? value : SubscriptionStatus.NONE);

const isSameColumns = (before: OrganisationBillingRecord, next: SubscriptionColumns): boolean =>
    before.plan === next.plan &&
    before.subscriptionStatus === next.subscriptionStatus &&
    before.scheduledPlan === next.scheduledPlan &&
    before.periodEndsAt?.getTime() === next.periodEndsAt?.getTime() &&
    before.pastDueAt?.getTime() === next.pastDueAt?.getTime() &&
    before.billingSubscriptionId === next.billingSubscriptionId;

/**
 * Subscriptions (CONTEXT.md → Plans): the plan in effect on each company, started through the
 * provider's checkout, changed through its portal, mirrored from the provider's subscription
 * — webhooks are hints, a re-read of the subscription is the truth (integrations.md). Network
 * calls happen outside transactions; the state change and its audit event are one transaction.
 */
@Injectable()
export class BillingService {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly gateway: BillingGateway,
        private readonly userService: UserService,
        private readonly auditService: AuditService,
        private readonly config: AppConfigService,
        private readonly metrics: MetricsService,
        @InjectPinoLogger(BillingService.name) private readonly logger: PinoLogger,
    ) {}

    info(): { isTestMode: boolean } {
        return { isTestMode: this.gateway.isTestMode };
    }

    async summary(organisationId: string): Promise<BillingSummary> {
        return this.toSummary(await this.requireBilling(organisationId));
    }

    /** For hiring: the plan and how many active employees it allows. */
    async findEmployeeLimit(organisationId: string): Promise<EmployeeLimit> {
        const plan = toPlan((await this.billingRepository.findPlan(organisationId)) ?? Plan.STARTER);
        return { plan, maxEmployees: PLAN_CATALOGUE[plan].maxEmployees };
    }

    /**
     * The hosted checkout for a paid plan (charged at once). A company with a subscription changes
     * it in the portal instead. The provider's customer is created first and stored, then the
     * session — each a call outside any transaction.
     */
    async startCheckout(principal: Principal, plan: Plan, idempotencyKey: string): Promise<{ url: string }> {
        if (!isPaidPlan(plan)) {
            throw new BusinessRuleException('errors.billing.notPurchasable');
        }
        const billing = await this.requireBilling(principal.organisationId);
        if (billing.subscriptionStatus !== SubscriptionStatus.NONE) {
            throw new BusinessRuleException('errors.billing.alreadySubscribed');
        }
        if (billing.plan === plan) {
            throw new BusinessRuleException('errors.billing.samePlan');
        }
        const customerId = billing.billingCustomerId ?? (await this.ensureCustomer(billing, principal));
        const appUrl = this.config.get('APP_URL');
        return this.gateway.createCheckoutSession({
            organisationId: billing.id,
            customerId,
            plan,
            successUrl: `${appUrl}${BILLING_PATH}?checkout=success`,
            cancelUrl: `${appUrl}${BILLING_PATH}?checkout=canceled`,
            idempotencyKey,
        });
    }

    /**
     * Changes the plan from the app (CONTEXT.md → Plans and billing). With a subscription: a
     * higher plan applies now (charged at once), a lower one at the period end, Starter means a
     * cancellation at the period end, and the current plan again keeps it (drops a pending
     * change). Without one: Starter gives a isGrantedPlan plan up; a paid plan goes through checkout.
     */
    async changePlan(principal: Principal, target: Plan): Promise<BillingSummary> {
        const organisationId = principal.organisationId;
        const billing = await this.requireBilling(organisationId);
        const current = toPlan(billing.plan);
        if (billing.subscriptionStatus === SubscriptionStatus.NONE || !billing.billingSubscriptionId) {
            if (target !== Plan.STARTER) {
                throw new BusinessRuleException('errors.billing.noSubscription');
            }
            if (current !== Plan.STARTER) {
                await this.giveUpGrantedPlan(organisationId, billing);
            }
            return this.summary(organisationId);
        }
        const subscriptionId = billing.billingSubscriptionId;
        let subscription: ProviderSubscription;
        if (target === Plan.STARTER) {
            subscription = await this.gateway.isEndingAtPeriodEnd(subscriptionId);
        } else if (target === current) {
            if (billing.scheduledPlan === null) {
                return this.summary(organisationId);
            }
            subscription = await this.gateway.keepPlan(subscriptionId);
        } else {
            const when = PLANS.indexOf(target) > PLANS.indexOf(current) ? 'now' : 'period_end';
            subscription = await this.gateway.changePlan(subscriptionId, target, when);
        }
        await this.applySubscription(organisationId, subscription);
        return this.summary(organisationId);
    }

    /** A plan held without a subscription is given up: Starter at once, in the history. */
    @Transactional()
    private async giveUpGrantedPlan(organisationId: string, before: OrganisationBillingRecord): Promise<void> {
        await this.billingRepository.updateSubscription(organisationId, {
            plan: Plan.STARTER,
            subscriptionStatus: SubscriptionStatus.NONE,
            scheduledPlan: null,
            periodEndsAt: null,
            pastDueAt: null,
            billingSubscriptionId: null,
        });
        await this.auditService.record({
            action: AuditAction.ORGANISATION_PLAN_CHANGED,
            organisationId,
            employeeId: null,
            target: { type: AuditTargetType.ORGANISATION, id: organisationId, label: before.name },
            changes: changeOf(AuditField.PLAN, auditValue.text(before.plan), auditValue.text(Plan.STARTER)),
        });
    }

    /** The provider's portal: card, invoices, plan changes and cancellation. */
    async openPortal(organisationId: string): Promise<{ url: string }> {
        const billing = await this.requireBilling(organisationId);
        if (!billing.billingCustomerId) {
            throw new BusinessRuleException('errors.billing.noBillingAccount');
        }
        return this.gateway.createPortalSession(
            billing.billingCustomerId,
            `${this.config.get('APP_URL')}${BILLING_PATH}`,
        );
    }

    /**
     * Re-reads the company's subscription from the provider and applies it — after a checkout
     * (before the webhook may have arrived) or whenever the owner opens the page.
     */
    async sync(organisationId: string): Promise<BillingSummary> {
        const billing = await this.requireBilling(organisationId);
        if (billing.billingCustomerId) {
            const subscription = billing.billingSubscriptionId
                ? await this.gateway.findSubscription(billing.billingSubscriptionId)
                : await this.gateway.findLatestSubscription(billing.billingCustomerId);
            if (subscription) {
                await this.applySubscription(organisationId, subscription);
            } else if (billing.billingSubscriptionId) {
                await this.applyEnded(organisationId, billing.billingSubscriptionId);
            }
        }
        return this.summary(organisationId);
    }

    /**
     * A webhook delivery: verified, stored (the provider's event id is unique — a repeat is a
     * no-op), then processed right away (integrations.md → store first, process later). Always
     * answered 200 once stored: a processing failure is recorded on the row and the nightly
     * reconciliation catches up.
     */
    async receiveWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ isDuplicate: boolean }> {
        const event = this.gateway.parseWebhook(rawBody, signature);
        const stored = await this.billingRepository.createEvent({
            providerEventId: event.id,
            type: event.type,
            occurredAt: event.occurredAt,
            organisationId: null,
            subscriptionId: event.subscriptionId,
            customerId: event.customerId,
        });
        if (!stored) {
            this.metrics.billingWebhookEvents.inc({ type: event.type, outcome: 'isDuplicate' });
            return { isDuplicate: true };
        }
        await this.processEvent(event.id);
        return { isDuplicate: false };
    }

    /** Resolves the company, re-reads the subscription (the truth) and applies it. */
    private async processEvent(providerEventId: string): Promise<void> {
        const event = await this.billingRepository.findEventByProviderId(providerEventId);
        if (!event || event.processedAt) {
            return;
        }
        let organisationId: string | null = null;
        let error: string | null = null;
        try {
            organisationId = await this.resolveOrganisation(event.subscriptionId, event.customerId);
            if (!organisationId) {
                error = 'No company has this subscription or customer';
            } else if (event.subscriptionId) {
                const subscription = await this.gateway.findSubscription(event.subscriptionId);
                if (subscription) {
                    await this.applySubscription(organisationId, subscription);
                } else {
                    await this.applyEnded(organisationId, event.subscriptionId);
                }
            } else if (event.customerId) {
                const subscription = await this.gateway.findLatestSubscription(event.customerId);
                if (subscription) {
                    await this.applySubscription(organisationId, subscription);
                }
            }
        } catch (caught) {
            error = 'Processing failed';
            this.logger.warn({ err: caught, providerEventId, type: event.type }, 'Webhook not applied');
        }
        await this.billingRepository.markEventProcessed(event.id, { organisationId, error });
        this.metrics.billingWebhookEvents.inc({ type: event.type, outcome: error ? 'error' : 'ok' });
    }

    private async resolveOrganisation(
        subscriptionId: string | null,
        customerId: string | null,
    ): Promise<string | null> {
        const bySubscription = subscriptionId
            ? await this.billingRepository.findIdBySubscriptionId(subscriptionId)
            : null;
        if (bySubscription) {
            return bySubscription;
        }
        return customerId ? this.billingRepository.findIdByCustomerId(customerId) : null;
    }

    /**
     * Mirrors a provider subscription onto the company: the plan of its price, its state, period
     * and scheduled change. Idempotent and order-tolerant — it writes the state the provider holds
     * now, so a stale event cannot regress it. A no-op writes nothing; a plan change is audited.
     */
    @Transactional()
    async applySubscription(organisationId: string, subscription: ProviderSubscription): Promise<void> {
        const before = await this.requireBilling(organisationId);
        const isCurrent = before.billingSubscriptionId === subscription.id;
        if (subscription.state === SubscriptionState.PENDING) {
            // Not paid yet (checkout open or abandoned): nothing changes.
            return;
        }
        if (subscription.state === SubscriptionState.ENDED && !isCurrent) {
            // An older or never-recorded subscription ended: the current state stays.
            return;
        }
        const next = this.nextColumns(before, subscription);
        if (isSameColumns(before, next)) {
            return;
        }
        await this.billingRepository.updateSubscription(organisationId, next);
        if (before.plan !== next.plan) {
            await this.auditService.record({
                action: AuditAction.ORGANISATION_PLAN_CHANGED,
                organisationId,
                employeeId: null,
                target: { type: AuditTargetType.ORGANISATION, id: organisationId, label: before.name },
                changes: changeOf(AuditField.PLAN, auditValue.text(before.plan), auditValue.text(next.plan)),
            });
        }
        this.logger.info(
            {
                organisationId,
                plan: next.plan,
                status: next.subscriptionStatus,
                scheduledPlan: next.scheduledPlan,
            },
            'Subscription applied',
        );
    }

    private nextColumns(before: OrganisationBillingRecord, subscription: ProviderSubscription): SubscriptionColumns {
        if (subscription.state === SubscriptionState.ENDED) {
            return {
                plan: Plan.STARTER,
                subscriptionStatus: SubscriptionStatus.NONE,
                scheduledPlan: null,
                periodEndsAt: null,
                pastDueAt: null,
                billingSubscriptionId: null,
            };
        }
        const plan = subscription.plan ?? toPlan(before.plan);
        const scheduledPlan = subscription.isEndingAtPeriodEnd
            ? Plan.STARTER
            : subscription.scheduledPlan && subscription.scheduledPlan !== plan
              ? subscription.scheduledPlan
              : null;
        const isPastDue = subscription.state === SubscriptionState.PAST_DUE;
        return {
            plan,
            subscriptionStatus: isPastDue ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE,
            scheduledPlan,
            periodEndsAt: subscription.periodEndsAt,
            // The grace period counts from the first failure we saw, not from each retry.
            pastDueAt: isPastDue ? (before.pastDueAt ?? new Date()) : null,
            billingSubscriptionId: subscription.id,
        };
    }

    /** The provider no longer has the subscription: back to Starter. */
    private applyEnded(organisationId: string, subscriptionId: string): Promise<void> {
        return this.applySubscription(organisationId, {
            id: subscriptionId,
            customerId: '',
            state: SubscriptionState.ENDED,
            plan: null,
            periodEndsAt: null,
            isEndingAtPeriodEnd: false,
            scheduledPlan: null,
        });
    }

    /**
     * Grace periods over: the subscription is canceled at the provider and the company is back on
     * Starter. One provider call per company (bounded per run); a cancel that the provider refuses
     * (already canceled) falls back to re-reading it.
     */
    @Cron(CronExpression.EVERY_HOUR, { timeZone: 'UTC' })
    async endGracePeriods(): Promise<void> {
        const limit = new Date(Date.now() - GRACE_PERIOD_DAYS * DAY_MS);
        const companies = await this.billingRepository.findPastDueBefore(limit, MAX_GRACE_ENDINGS_PER_RUN);
        let ended = 0;
        for (const company of companies) {
            if (!company.billingSubscriptionId) {
                continue;
            }
            try {
                let subscription: ProviderSubscription | null;
                try {
                    subscription = await this.gateway.cancelSubscription(company.billingSubscriptionId);
                } catch (caught) {
                    if (!(caught instanceof BusinessRuleException)) {
                        throw caught;
                    }
                    subscription = await this.gateway.findSubscription(company.billingSubscriptionId);
                }
                if (subscription) {
                    await this.applySubscription(company.id, subscription);
                } else {
                    await this.applyEnded(company.id, company.billingSubscriptionId);
                }
                ended += 1;
            } catch (caught) {
                this.logger.warn({ err: caught, organisationId: company.id }, 'Grace period not ended');
            }
        }
        if (ended > 0) {
            this.logger.info({ count: ended }, 'Grace periods ended');
        }
    }

    /**
     * Webhooks are hints; this is the truth: every subscription we hold is re-read from the
     * provider and applied (bounded per run). Old stored deliveries are deleted.
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'UTC' })
    async reconcile(): Promise<void> {
        const companies = await this.billingRepository.findWithSubscription(MAX_RECONCILED_PER_RUN);
        for (const company of companies) {
            if (!company.billingSubscriptionId) {
                continue;
            }
            try {
                const subscription = await this.gateway.findSubscription(company.billingSubscriptionId);
                if (subscription) {
                    await this.applySubscription(company.id, subscription);
                } else {
                    await this.applyEnded(company.id, company.billingSubscriptionId);
                }
            } catch (caught) {
                this.logger.warn({ err: caught, organisationId: company.id }, 'Subscription not reconciled');
            }
        }
        const deleted = await this.billingRepository.deleteEventsBefore(
            new Date(Date.now() - EVENT_RETENTION_DAYS * DAY_MS),
        );
        this.logger.info({ companies: companies.length, deletedEvents: deleted }, 'Billing reconciled');
    }

    /** Creates the provider's customer for the company (a call, then stored). */
    private async ensureCustomer(billing: OrganisationBillingRecord, principal: Principal): Promise<string> {
        const owner = await this.userService.findProfileById(principal.userId);
        const customerId = await this.gateway.createCustomer({
            organisationId: billing.id,
            name: billing.name,
            email: owner?.email ?? principal.email,
        });
        if (!(await this.billingRepository.setCustomerId(billing.id, customerId))) {
            // Another request stored one meanwhile; that one is the company's.
            const current = await this.requireBilling(billing.id);
            return current.billingCustomerId ?? customerId;
        }
        return customerId;
    }

    private async requireBilling(organisationId: string): Promise<OrganisationBillingRecord> {
        const billing = await this.billingRepository.findBilling(organisationId);
        if (!billing) {
            throw new ResourceNotFoundException();
        }
        return billing;
    }

    private toSummary(billing: OrganisationBillingRecord): BillingSummary {
        const status = toStatus(billing.subscriptionStatus);
        const plan = toPlan(billing.plan);
        return {
            plan,
            status,
            scheduledPlan: billing.scheduledPlan ? toPlan(billing.scheduledPlan) : null,
            periodEndsAt: billing.periodEndsAt,
            pastDueAt: billing.pastDueAt,
            graceEndsAt: billing.pastDueAt ? graceEndsAt(billing.pastDueAt) : null,
            hasBillingAccount: billing.billingCustomerId !== null,
            isGrantedPlan: status === SubscriptionStatus.NONE && plan !== Plan.STARTER,
            isTestMode: this.gateway.isTestMode,
            plans: PLANS.map((name) => PLAN_CATALOGUE[name]),
        };
    }
}
