import { Module } from '@nestjs/common';
import { EmployeeModule } from '../core/employee.module';
import { ReviewModule } from '../review/review.module';
import { HiringController } from './controller/hiring.controller';
import { HiringService } from './service/hiring.service';

@Module({
  imports: [EmployeeModule, ReviewModule],
  controllers: [HiringController],
  providers: [HiringService],
})
export class HiringModule {}
