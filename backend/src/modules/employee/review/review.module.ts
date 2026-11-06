import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { EmployeeModule } from '../core/employee.module';
import { ReviewController } from './controller/review.controller';
import { ReviewRepository } from './repository/review.repository';
import { ReviewService } from './service/review.service';

@Module({
  imports: [EmployeeModule, AuditModule],
  controllers: [ReviewController],
  exports: [ReviewService],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
