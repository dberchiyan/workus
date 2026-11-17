import { PrismaPg } from '@prisma/adapter-pg';
import Stripe from 'stripe';
import { z } from 'zod';

import { databaseUrl } from '../src/common/config/database-url';
import { PrismaClient } from '../src/generated/prisma/client';

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
        } catch {}
    }
    process.stdout.write(`Canceled ${organisations.length} test subscriptions\n`);
};

const reset = async (): Promise<void> => {
    try {
        process.loadEnvFile('.env');
    } catch {}
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
