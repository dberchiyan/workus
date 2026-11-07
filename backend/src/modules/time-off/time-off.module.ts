import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmployeeModule } from '../employee/core/employee.module';
import { EmployeeTimeOffController } from './controller/employee-time-off.controller';
import { TimeOffCalendarController } from './controller/time-off-calendar.controller';
import { ManagedTimeOffController } from './controller/managed-time-off.controller';
import { TimeOffController } from './controller/time-off.controller';
import { TimeOffRequestRepository } from './repository/time-off-request.repository';
import { TimeOffCommentService } from './service/time-off-comment.service';
import { TimeOffDecisionService } from './service/time-off-decision.service';
import { TimeOffService } from './service/time-off.service';

@Module({
  imports: [EmployeeModule, AuditModule],
  controllers: [
    TimeOffController,
    TimeOffCalendarController,
    EmployeeTimeOffController,
    ManagedTimeOffController,
  ],
  exports: [TimeOffService],
  providers: [
    TimeOffService,
    TimeOffDecisionService,
    TimeOffCommentService,
    TimeOffRequestRepository,
  ],
})
export class TimeOffModule {}
