import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/core/employee.module';
import { ReviewModule } from '../employee/review/review.module';
import { TimeOffModule } from '../time-off/time-off.module';
import { InsightsController } from './controller/insights.controller';
import { InsightsService } from './service/insights.service';

@Module({
  imports: [EmployeeModule, ReviewModule, TimeOffModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
