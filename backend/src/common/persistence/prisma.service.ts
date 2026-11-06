import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import { AppConfigService } from '../config/app-config.service';
import type { RequestContext } from '../context/request-context';
import { PG_POOL } from './pg-pool';

type PrismaOptions = {
  adapter: PrismaPg;
  log: [
    { emit: 'event'; level: 'query' },
    { emit: 'event'; level: 'warn' },
    { emit: 'event'; level: 'error' },
  ];
};

@Injectable()
export class PrismaService extends PrismaClient<PrismaOptions> implements OnModuleDestroy {
  constructor(
    @Inject(PG_POOL) pool: Pool,
    config: AppConfigService,
    cls: ClsService<RequestContext>,
    @InjectPinoLogger(PrismaService.name) logger: PinoLogger,
  ) {
    super({
      adapter: new PrismaPg(pool),
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
    const isQueryLogOn = config.get('DB_QUERY_LOG');
    this.$on('query', (event) => {
      if (!isQueryLogOn) {
        return;
      }
      if (cls.isActive()) {
        cls.set('queryCount', (cls.get('queryCount') ?? 0) + 1);
      }
      logger.debug({ durationMs: event.duration }, event.query);
    });
    this.$on('warn', (event) => {
      logger.warn({ target: event.target }, event.message);
    });
    this.$on('error', (event) => {
      logger.error({ target: event.target }, event.message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
