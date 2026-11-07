import { Module } from '@nestjs/common';
import { SessionAuthenticator } from '../../common/security/session-authenticator';
import { EmployeeModule } from '../employee/core/employee.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './controller/auth.controller';
import { SessionCookies } from './controller/session-cookies';
import { SessionRepository } from './repository/session.repository';
import { AuthService } from './service/auth.service';
import { PasswordHasher } from './service/password-hasher.service';
import { SessionService } from './service/session.service';

@Module({
  imports: [UserModule, EmployeeModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    PasswordHasher,
    SessionRepository,
    SessionCookies,
    { provide: SessionAuthenticator, useExisting: SessionService },
  ],
  // SessionService: other modules sign people out (a termination that takes effect today).
  exports: [SessionAuthenticator, SessionService],
})
export class AuthModule {}
