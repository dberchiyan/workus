import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/** Typed access to the validated environment. Code never reads `process.env`. */
@Injectable()
export class AppConfigService {
    constructor(private readonly config: ConfigService<Env, true>) {}

    get<K extends keyof Env>(key: K): Env[K] {
        return this.config.get(key, { infer: true });
    }

    get isDev(): boolean {
        return this.get('APP_ENV') === 'dev';
    }

    /** Stripe test keys: payments are not real and the test card is worth naming (the demo). */
    get isBillingTestMode(): boolean {
        return (
            this.get('BILLING_PROVIDER') === 'stripe' && (this.get('STRIPE_SECRET_KEY') ?? '').startsWith('sk_test_')
        );
    }

    get isDemo(): boolean {
        return this.get('DEMO_MODE');
    }

    /** In the demo, a showcase account (DEMO_PROTECTED_EMAILS) that nobody may edit. */
    isDemoProtected(email: string): boolean {
        return this.isDemo && this.get('DEMO_PROTECTED_EMAILS').includes(email.toLowerCase());
    }
}
