import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmployeeModule } from '../employee/core/employee.module';
import { EmployeeTimeOffController } from './controller/employee-time-off.controller';
import { TimeOffController } from './controller/time-off.controller';
import { TimeOffRequestRepository } from './repository/time-off-request.repository';
import { TimeOffService } from './service/time-off.service';

@Module({
  imports: [EmployeeModule, AuditModule],
  controllers: [TimeOffController, EmployeeTimeOffController],
  exports: [TimeOffService],
  providers: [TimeOffService, TimeOffRequestRepository],
})
export class TimeOffModule {}
