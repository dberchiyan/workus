import Stripe from 'stripe';
import { z } from 'zod';

import { PLAN_CATALOGUE } from '../src/common/plan/plan';

const env = z.object({ STRIPE_SECRET_KEY: z.string().min(1) }).parse(process.env);
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    timeout: 15_000,
    appInfo: { name: 'Workus setup' },
});

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
];

/** Minor units from the catalogue's decimal string (never float arithmetic). */
const toCents = (amount: string): number => {
    const [whole = '0', fraction = ''] = amount.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};

const ensurePrice = async (plan: 'TEAM' | 'BUSINESS'): Promise<string> => {
    const offer = PLAN_CATALOGUE[plan];
    const lookupKey = `workus_${plan.toLowerCase()}_monthly`;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const found = existing.data[0];
    if (found) {
        return found.id;
    }
    const product = await stripe.products.create({
        name: `Workus ${offer.name}`,
        description: offer.maxEmployees === null ? 'Unlimited employees' : `Up to ${offer.maxEmployees} employees`,
        metadata: { plan },
    });
    const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: toCents(offer.monthlyPriceUsd),
        recurring: { interval: 'month' },
        lookup_key: lookupKey,
        metadata: { plan },
    });
    return price.id;
};

const ensurePortal = async (teamPrice: string, businessPrice: string): Promise<string> => {
    const [team, business] = await Promise.all([
        stripe.prices.retrieve(teamPrice),
        stripe.prices.retrieve(businessPrice),
    ]);
    const productId = (price: Stripe.Price): string =>
        typeof price.product === 'string' ? price.product : price.product.id;
    const configuration = await stripe.billingPortal.configurations.create({
        business_profile: { headline: 'Workus — manage your subscription' },
        features: {
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' },
            subscription_update: {
                enabled: true,
                default_allowed_updates: ['price'],
                products: [
                    { product: productId(team), prices: [team.id] },
                    { product: productId(business), prices: [business.id] },
                ],
                proration_behavior: 'always_invoice',
                schedule_at_period_end: { conditions: [{ type: 'decreasing_item_amount' }] },
            },
        },
        metadata: { app: 'workus' },
    });
    return configuration.id;
};

const main = async (): Promise<void> => {
    const webhookUrl = process.argv[process.argv.indexOf('--webhook-url') + 1];
    const [teamPrice, businessPrice] = await Promise.all([ensurePrice('TEAM'), ensurePrice('BUSINESS')]);
    const portal = await ensurePortal(teamPrice, businessPrice);
    const lines = [
        'BILLING_PROVIDER=stripe',
        `STRIPE_PRICE_TEAM=${teamPrice}`,
        `STRIPE_PRICE_BUSINESS=${businessPrice}`,
        `STRIPE_PORTAL_CONFIGURATION=${portal}`,
    ];
    if (process.argv.includes('--webhook-url') && webhookUrl) {
        const endpoint = await stripe.webhookEndpoints.create({
            url: webhookUrl,
            enabled_events: WEBHOOK_EVENTS,
            description: 'Workus billing',
        });
        lines.push(`STRIPE_WEBHOOK_SECRET=${endpoint.secret ?? ''}`);
    }
    process.stdout.write(`${lines.join('\n')}\n`);
};

void main();
