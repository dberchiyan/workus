import { Module } from '@nestjs/common';
import { SessionAuthenticator } from '../../common/security/session-authenticator';
import { AuditModule } from '../audit/audit.module';
import { EmployeeModule } from '../employee/core/employee.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './controller/auth.controller';
import { SessionRepository } from './repository/session.repository';
import { AuthService } from './service/auth.service';
import { PasswordHasher } from './service/password-hasher.service';
import { SessionService } from './service/session.service';

@Module({
  imports: [UserModule, EmployeeModule, AuditModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    PasswordHasher,
    SessionRepository,
    { provide: SessionAuthenticator, useExisting: SessionService },
  ],
  // SessionService: other modules sign people out (a termination that takes effect today, a role
  // change). AuthService and PasswordHasher: registration starts the new owner's first session.
  exports: [SessionAuthenticator, SessionService, AuthService, PasswordHasher],
})
export class AuthModule {}
