import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MoneySchema } from '../../../../common/dto/money';
import { FeatureSchema, PlanSchema } from '../../../../common/dto/plan';
import { PAID_PLANS } from '../../../../common/plan/plan';
import { SUBSCRIPTION_STATUSES } from '../../service/subscription-status';

export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES).meta({ id: 'SubscriptionStatus' });

/** One plan as the pricing table shows it. */
export const PlanOfferSchema = z
    .object({
        plan: PlanSchema,
        name: z.string().max(32),
        monthlyPrice: MoneySchema,
        /** Active employees the plan allows; null = unlimited. */
        maxEmployees: z.number().int().min(1).nullable(),
        features: z.array(FeatureSchema).max(16),
    })
    .meta({ id: 'PlanOffer' });

export const BillingResponseSchema = z.object({
    plan: PlanSchema,
    status: SubscriptionStatusSchema,
    /** The plan the subscription switches to when the paid period ends; null = it stays. */
    scheduledPlan: PlanSchema.nullable(),
    /** End of the paid period: the next charge, or when the scheduled change applies. */
    currentPeriodEnd: z.iso.datetime().nullable(),
    pastDueSince: z.iso.datetime().nullable(),
    /** When the grace period ends and the company returns to Starter. */
    graceEndsAt: z.iso.datetime().nullable(),
    /** The company has a billing account: Manage billing (card, invoices, plan) can open. */
    canManage: z.boolean(),
    /** A paid plan held without a subscription (set by Workus). */
    granted: z.boolean(),
    /** Test keys: payments are not real (the demo). */
    testMode: z.boolean(),
    plans: z.array(PlanOfferSchema).max(8),
});
export class BillingResponse extends createZodDto(BillingResponseSchema) {}

export const CheckoutSessionRequestSchema = z.object({
    plan: z.enum(PAID_PLANS),
});
export class CheckoutSessionRequest extends createZodDto(CheckoutSessionRequestSchema) {}

/** The plan to move to: Starter = cancel (or give a granted plan up); the current one = keep it. */
export const ChangePlanRequestSchema = z.object({ plan: PlanSchema });
export class ChangePlanRequest extends createZodDto(ChangePlanRequestSchema) {}

/** Where the browser goes next (the provider's hosted page). */
export const BillingRedirectResponseSchema = z.object({ url: z.url() });
export class BillingRedirectResponse extends createZodDto(BillingRedirectResponseSchema) {}

export const BillingInfoResponseSchema = z.object({
    /** Payments run against test keys: the sign-in page shows the test card. */
    testMode: z.boolean(),
});
export class BillingInfoResponse extends createZodDto(BillingInfoResponseSchema) {}

export const WebhookReceiptResponseSchema = z.object({
    received: z.literal(true),
    /** The event was delivered before and changed nothing this time. */
    duplicate: z.boolean(),
});
export class WebhookReceiptResponse extends createZodDto(WebhookReceiptResponseSchema) {}
