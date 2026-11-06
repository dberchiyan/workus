import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/core/employee.module';
import { ReviewModule } from '../employee/review/review.module';
import { TimeOffModule } from '../time-off/time-off.module';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';

@Module({
  imports: [EmployeeModule, ReviewModule, TimeOffModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
