import { PrismaPg } from '@prisma/adapter-pg';
import Stripe from 'stripe';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client';
import { databaseUrl } from '../src/common/config/database-url';

/**
 * Empties the demo database (DEMO_MODE=true only): drops the `public` schema with every table,
 * row and trigger, then creates it empty. `npm run db:demo-reset` follows with the migrations and
 * the seed. A schema drop, not TRUNCATE — `audit_events` refuses TRUNCATE by design. With a
 * Stripe key, the companies' test subscriptions are canceled first, so none keeps renewing for
 * a company that no longer exists.
 */
const resetEnv = z.object({
    DEMO_MODE: z.literal('true'),
    DATABASE_HOST: z.string().min(1),
    DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
    DATABASE_NAME: z.string().min(1),
    DATABASE_USERNAME: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    STRIPE_SECRET_KEY: z
        .string()
        .optional()
        .transform((value) => (value ? value : undefined)),
});

/** Subscriptions canceled per reset — the demo holds a handful; a backlog never builds. */
const MAX_CANCELED = 100;

const cancelSubscriptions = async (prisma: PrismaClient, secretKey: string): Promise<void> => {
    const stripe = new Stripe(secretKey, { timeout: 15_000, appInfo: { name: 'Workus demo reset' } });
    const organisations = await prisma.organisation.findMany({
        where: { billingSubscriptionId: { not: null } },
        select: { billingSubscriptionId: true },
        take: MAX_CANCELED,
    });
    for (const { billingSubscriptionId } of organisations) {
        if (!billingSubscriptionId) {
            continue;
        }
        try {
            await stripe.subscriptions.cancel(billingSubscriptionId);
        } catch {
            // Already canceled or gone: nothing to keep from renewing.
        }
    }
    process.stdout.write(`Canceled ${organisations.length} test subscriptions\n`);
};

const reset = async (): Promise<void> => {
    try {
        process.loadEnvFile('.env');
    } catch {
        // Variables come from the environment.
    }
    const env = resetEnv.parse(process.env);
    const prisma = new PrismaClient({
        adapter: new PrismaPg({
            connectionString: databaseUrl({
                host: env.DATABASE_HOST,
                port: env.DATABASE_PORT,
                name: env.DATABASE_NAME,
                username: env.DATABASE_USERNAME,
                password: env.DATABASE_PASSWORD,
            }),
        }),
    });
    try {
        if (env.STRIPE_SECRET_KEY) {
            await cancelSubscriptions(prisma, env.STRIPE_SECRET_KEY);
        }
        await prisma.$transaction([
            prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE'),
            prisma.$executeRawUnsafe('CREATE SCHEMA public'),
        ]);
        process.stdout.write(`Demo database ${env.DATABASE_NAME} emptied\n`);
    } finally {
        await prisma.$disconnect();
    }
};

void reset();
