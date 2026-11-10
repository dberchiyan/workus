import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { UserModule } from '../../user/user.module';
import { EmployeeActivityController } from './controller/employee-activity.controller';
import { EmployeeSecurityLogController } from './controller/employee-security-log.controller';
import { EmployeeOptionController } from './controller/employee-option.controller';
import { CompanyStructureController } from './controller/company-structure.controller';
import { EmployeeController } from './controller/employee.controller';
import { PositionCategoryController } from './controller/position-category.controller';
import { CompanyStructureRepository } from './repository/company-structure.repository';
import { EmployeeRepository } from './repository/employee.repository';
import { PositionCategoryRepository } from './repository/position-category.repository';
import { CompanyStructureService } from './service/company-structure.service';
import { EmployeeService } from './service/employee.service';
import { PositionCategoryService } from './service/position-category.service';

@Module({
  imports: [UserModule, AuditModule],
  controllers: [
    EmployeeController,
    EmployeeActivityController,
    EmployeeSecurityLogController,
    PositionCategoryController,
    EmployeeOptionController,
    CompanyStructureController,
  ],
  exports: [EmployeeService, CompanyStructureService],
  providers: [
    EmployeeService,
    PositionCategoryService,
    EmployeeRepository,
    PositionCategoryRepository,
    CompanyStructureService,
    CompanyStructureRepository,
  ],
})
export class EmployeeModule {}
