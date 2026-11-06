import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppConfigModule } from './common/config/config.module';
import { AppConfigService } from './common/config/app-config.service';
import { ContextModule } from './common/context/context.module';
import { GlobalExceptionFilter } from './common/exception/global-exception.filter';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor';
import { AppI18nModule } from './common/i18n/i18n.module';
import { createLoggerOptions } from './common/observability/logger.options';
import { ObservabilityModule } from './common/observability/observability.module';
import { TimingInterceptor } from './common/observability/timing.interceptor';
import { PersistenceModule } from './common/persistence/persistence.module';
import { AuthorizationGuard } from './common/security/authorization.guard';
import { CsrfGuard } from './common/security/csrf.guard';
import { JsonOnlyMiddleware } from './common/security/json-only.middleware';
import { RateLimitGuard } from './common/security/rate-limit.guard';
import { SecurityModule } from './common/security/security.module';
import { SessionGuard } from './common/security/session.guard';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => createLoggerOptions(config.isDev),
    }),
    ContextModule,
    PersistenceModule,
    AppI18nModule,
    ObservabilityModule,
    SecurityModule,
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    EmployeeModule,
  ],
  providers: [
    // Guards run in registration order (security.md → Guards).
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Outermost first: timing measures everything; idempotency stores the serialized response.
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JsonOnlyMiddleware).forRoutes('*path');
  }
}
