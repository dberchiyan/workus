import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { ReviewController } from './controller/review.controller';
import { ReviewRepository } from './repository/review.repository';
import { ReviewService } from './service/review.service';

@Module({
  imports: [EmployeeModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
