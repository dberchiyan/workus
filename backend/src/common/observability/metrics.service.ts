import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, exponentialBuckets, Histogram, Registry } from '@prometheus-io/client';

const FIRST_BUCKET_SECONDS = 0.025;
const BUCKET_FACTOR = 2;
const BUCKET_COUNT = 8;
const DURATION_BUCKETS_SECONDS = exponentialBuckets(FIRST_BUCKET_SECONDS, BUCKET_FACTOR, BUCKET_COUNT);

@Injectable()
export class MetricsService {
    readonly registry = new Registry();

    readonly httpRequestDuration = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration by route pattern',
        labelNames: ['method', 'route', 'status'] as const,
        buckets: DURATION_BUCKETS_SECONDS,
        registers: [this.registry],
    });

    readonly failedLogins = new Counter({
        name: 'auth_failed_logins_total',
        help: 'Failed login attempts',
        registers: [this.registry],
    });

    readonly rateLimitHits = new Counter({
        name: 'rate_limit_hits_total',
        help: 'Requests rejected by a rate limiter',
        labelNames: ['limiter'] as const,
        registers: [this.registry],
    });

    readonly idempotencyCollisions = new Counter({
        name: 'idempotency_collisions_total',
        help: 'Requests rejected for a reused or in-flight Idempotency-Key',
        labelNames: ['reason'] as const,
        registers: [this.registry],
    });

    /** Calls to the payment provider by operation and outcome (integrations.md). */
    readonly billingProviderCalls = new Counter({
        name: 'billing_provider_calls_total',
        help: 'Payment provider calls by operation and outcome',
        labelNames: ['operation', 'outcome'] as const,
        registers: [this.registry],
    });

    readonly webhookSignatureFailures = new Counter({
        name: 'webhook_signature_failures_total',
        help: 'Webhook deliveries refused for a bad signature',
        labelNames: ['provider'] as const,
        registers: [this.registry],
    });

    readonly billingWebhookEvents = new Counter({
        name: 'billing_webhook_events_total',
        help: 'Billing webhook events by type and outcome',
        labelNames: ['type', 'outcome'] as const,
        registers: [this.registry],
    });

    constructor() {
        collectDefaultMetrics({ register: this.registry });
    }
}
