import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/core/employee.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { OrganisationController } from './controller/organisation.controller';
import { RegistrationController } from './controller/registration.controller';
import { OrganisationRepository } from './repository/organisation.repository';
import { OrganisationService } from './service/organisation.service';

@Module({
  imports: [AuthModule, UserModule, AuditModule, EmployeeModule],
  controllers: [RegistrationController, OrganisationController],
  providers: [OrganisationService, OrganisationRepository],
})
export class OrganisationModule {}
