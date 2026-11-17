import { AuthModule } from '../../auth/auth.module';
import { BillingModule } from '../../billing/billing.module';
import { Module } from '@nestjs/common';
import { EmployeeModule } from '../core/employee.module';
import { ReviewModule } from '../review/review.module';
import { EmploymentController } from './controller/employment.controller';
import { EmploymentService } from './service/employment.service';

@Module({
    imports: [EmployeeModule, ReviewModule, AuthModule, BillingModule],
    controllers: [EmploymentController],
    providers: [EmploymentService],
})
export class EmploymentModule {}
