import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { RouteAuditService } from './route-audit.service';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [RateLimitService, RouteAuditService],
  exports: [RateLimitService],
})
export class SecurityModule {}
