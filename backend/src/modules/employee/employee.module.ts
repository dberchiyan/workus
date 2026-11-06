import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { EmployeeOptionController } from './controller/employee-option.controller';
import { EmployeeController } from './controller/employee.controller';
import { PositionCategoryController } from './controller/position-category.controller';
import { EmployeeRepository } from './repository/employee.repository';
import { PositionCategoryRepository } from './repository/position-category.repository';
import { EmployeeService } from './service/employee.service';
import { PositionCategoryService } from './service/position-category.service';

@Module({
  imports: [UserModule],
  controllers: [EmployeeController, PositionCategoryController, EmployeeOptionController],
  providers: [
    EmployeeService,
    PositionCategoryService,
    EmployeeRepository,
    PositionCategoryRepository,
  ],
})
export class EmployeeModule {}
