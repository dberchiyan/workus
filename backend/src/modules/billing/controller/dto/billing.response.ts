import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_PLAN_FEATURES, MAX_PLAN_NAME_LENGTH, MAX_PLAN_OFFERS } from '../../../../common/dto/limits';
import { MoneySchema } from '../../../../common/dto/money';
import { FeatureSchema, PlanSchema } from '../../../../common/dto/plan';
import { PAID_PLANS } from '../../../../common/plan/plan';
import { SUBSCRIPTION_STATUSES } from '../../service/subscription-status';

export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES).meta({ id: 'SubscriptionStatus' });

export const PlanOfferSchema = z
    .object({
        plan: PlanSchema,
        name: z.string().max(MAX_PLAN_NAME_LENGTH),
        monthlyPrice: MoneySchema,
        maxEmployees: z.number().int().min(1).nullable(),
        features: z.array(FeatureSchema).max(MAX_PLAN_FEATURES),
    })
    .meta({ id: 'PlanOffer' });

export const BillingResponseSchema = z.object({
    plan: PlanSchema,
    status: SubscriptionStatusSchema,
    scheduledPlan: PlanSchema.nullable(),
    periodEndsAt: z.iso.datetime().nullable(),
    pastDueAt: z.iso.datetime().nullable(),
    graceEndsAt: z.iso.datetime().nullable(),
    hasBillingAccount: z.boolean(),
    isGrantedPlan: z.boolean(),
    isTestMode: z.boolean(),
    plans: z.array(PlanOfferSchema).max(MAX_PLAN_OFFERS),
});
export class BillingResponse extends createZodDto(BillingResponseSchema) {}

export const CheckoutSessionRequestSchema = z.object({
    plan: z.enum(PAID_PLANS),
});
export class CheckoutSessionRequest extends createZodDto(CheckoutSessionRequestSchema) {}

export const ChangePlanRequestSchema = z.object({ plan: PlanSchema });
export class ChangePlanRequest extends createZodDto(ChangePlanRequestSchema) {}

export const BillingRedirectResponseSchema = z.object({ url: z.url() });
export class BillingRedirectResponse extends createZodDto(BillingRedirectResponseSchema) {}

export const BillingInfoResponseSchema = z.object({
    isTestMode: z.boolean(),
});
export class BillingInfoResponse extends createZodDto(BillingInfoResponseSchema) {}

export const WebhookReceiptResponseSchema = z.object({
    received: z.literal(true),
    isDuplicate: z.boolean(),
});
export class WebhookReceiptResponse extends createZodDto(WebhookReceiptResponseSchema) {}
