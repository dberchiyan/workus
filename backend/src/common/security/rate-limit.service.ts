import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { RateLimiterPostgres, RateLimiterRes } from 'rate-limiter-flexible';
import { RateLimitExceededException } from '../exception/api.exception';
import { MetricsService } from '../observability/metrics.service';
import { PG_POOL } from '../persistence/pg-pool';
import { RateLimitName } from './rate-limit';

const TABLE_NAME = 'rate_limits';
const SESSION_LIMIT = 'SESSION';
type LimiterName = RateLimitName | typeof SESSION_LIMIT;

const LIMITS: Readonly<Record<LimiterName, { points: number; durationSeconds: number }>> = {
  // security.md: login 5 / 15 min keyed by IP and email.
  [RateLimitName.LOGIN]: { points: 5, durationSeconds: 15 * 60 },
  // Per-session ceiling on everything else.
  [SESSION_LIMIT]: { points: 300, durationSeconds: 60 },
};

/** Keys are hashed so no IP or email is stored in the limiter table. */
const toKey = (parts: readonly string[]): string =>
  createHash('sha256').update(parts.join('|')).digest('hex');

@Injectable()
export class RateLimitService {
  private readonly limiters: ReadonlyMap<LimiterName, RateLimiterPostgres>;

  constructor(
    @Inject(PG_POOL) pool: Pool,
    private readonly metrics: MetricsService,
  ) {
    this.limiters = new Map(
      (Object.keys(LIMITS) as LimiterName[]).map((name) => [
        name,
        new RateLimiterPostgres({
          storeClient: pool,
          storeType: 'pool',
          tableName: TABLE_NAME,
          tableCreated: true,
          // The library deletes expired rows itself on a timer.
          clearExpiredByTimeout: true,
          keyPrefix: name.toLowerCase(),
          points: LIMITS[name].points,
          duration: LIMITS[name].durationSeconds,
        }),
      ]),
    );
  }

  consume(name: RateLimitName, keyParts: readonly string[]): Promise<void> {
    return this.consumeLimiter(name, toKey(keyParts));
  }

  consumeSession(sessionId: string): Promise<void> {
    return this.consumeLimiter(SESSION_LIMIT, sessionId);
  }

  async reset(name: RateLimitName, keyParts: readonly string[]): Promise<void> {
    await this.limiter(name).delete(toKey(keyParts));
  }

  private async consumeLimiter(name: LimiterName, key: string): Promise<void> {
    try {
      await this.limiter(name).consume(key);
    } catch (rejection: unknown) {
      if (rejection instanceof RateLimiterRes) {
        this.metrics.rateLimitHits.inc({ limiter: name.toLowerCase() });
        throw new RateLimitExceededException(Math.ceil(rejection.msBeforeNext / 1000));
      }
      throw rejection;
    }
  }

  private limiter(name: LimiterName): RateLimiterPostgres {
    const limiter = this.limiters.get(name);
    if (!limiter) {
      throw new Error(`Unknown rate limiter ${name}`);
    }
    return limiter;
  }
}
