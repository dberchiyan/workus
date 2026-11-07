import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionService } from './permission.service';
import { RateLimitService } from './rate-limit.service';
import { RouteAuditService } from './route-audit.service';
import { SessionCookies } from './session-cookies';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [RateLimitService, RouteAuditService, PermissionService, SessionCookies],
  exports: [RateLimitService, PermissionService, SessionCookies],
})
export class SecurityModule {}
