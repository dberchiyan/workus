import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import type { Pool } from 'pg';
import { AppConfigService } from '../config/app-config.service';
import { IdempotencyKeyStore } from './idempotency-key.store';
import { PersistenceHealthIndicator } from './persistence-health.indicator';
import { createPgPool, PG_POOL } from './pg-pool';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [TerminusModule],
  providers: [
    { provide: PG_POOL, inject: [AppConfigService], useFactory: createPgPool },
    PrismaService,
    PersistenceHealthIndicator,
    IdempotencyKeyStore,
  ],
  exports: [PG_POOL, PrismaService, PersistenceHealthIndicator, IdempotencyKeyStore],
})
export class PersistenceModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
