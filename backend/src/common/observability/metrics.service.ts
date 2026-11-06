import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from '@prometheus-io/client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration by route pattern',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
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

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }
}
