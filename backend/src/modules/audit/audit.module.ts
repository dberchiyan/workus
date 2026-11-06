import { Module } from '@nestjs/common';
import { AuditEventRepository } from './repository/audit-event.repository';
import { AuditService } from './service/audit.service';

/** Writes and reads the audit log; other modules record their changes through AuditService. */
@Module({
  exports: [AuditService],
  providers: [AuditService, AuditEventRepository],
})
export class AuditModule {}
