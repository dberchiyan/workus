import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionService } from './permission.service';
import { RateLimitService } from './rate-limit.service';
import { RouteAuditService } from './route-audit.service';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [RateLimitService, RouteAuditService, PermissionService],
  exports: [RateLimitService, PermissionService],
})
export class SecurityModule {}
