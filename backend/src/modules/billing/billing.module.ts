import { Module } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '../../common/config/app-config.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { ObservabilityModule } from '../../common/observability/observability.module';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../user/user.module';
import { FakeBillingGateway } from './adapter/fake/fake-billing.gateway';
import { StripeBillingGateway } from './adapter/stripe/stripe-billing.gateway';
import { BillingWebhookController } from './controller/billing-webhook.controller';
import { BillingController } from './controller/billing.controller';
import { BillingRepository } from './repository/billing.repository';
import { BillingGateway } from './service/billing-gateway';
import { BillingService } from './service/billing.service';

/**
 * Subscriptions and plans (integrations module, Stripe). The gateway port gets the adapter the
 * configuration names: Stripe with its keys, or the in-memory fake for local work.
 */
@Module({
  imports: [AuditModule, UserModule, ObservabilityModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    BillingService,
    BillingRepository,
    {
      provide: BillingGateway,
      inject: [AppConfigService, MetricsService, PinoLogger],
      useFactory: (config: AppConfigService, metrics: MetricsService, logger: PinoLogger) => {
        if (config.get('BILLING_PROVIDER') === 'stripe') {
          logger.setContext(StripeBillingGateway.name);
          return new StripeBillingGateway(config, metrics, logger);
        }
        return new FakeBillingGateway();
      },
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}
