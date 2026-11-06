import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  InvalidCredentialsException,
  NotAuthenticatedException,
} from '../../../common/exception/api.exception';
import { MetricsService } from '../../../common/observability/metrics.service';
import type { Principal } from '../../../common/security/principal';
import { loginRateLimitKey, RateLimitName } from '../../../common/security/rate-limit';
import { RateLimitService } from '../../../common/security/rate-limit.service';
import { UserService } from '../../user/service/user.service';
import type { UserProfile } from '../../user/service/user.types';
import { PasswordHasher } from './password-hasher.service';
import { type StartedSession, SessionService } from './session.service';

export interface LoginCommand {
  email: string;
  password: string;
  ip: string;
  userAgent: string | null;
  presentedToken: string | undefined;
}

export interface LoginResult {
  user: UserProfile;
  session: StartedSession;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordHasher: PasswordHasher,
    private readonly rateLimitService: RateLimitService,
    private readonly metrics: MetricsService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {}

  async login(input: LoginCommand): Promise<LoginResult> {
    const command = { ...input, email: input.email.toLowerCase() };
    const credentials = await this.userService.findCredentialsByEmail(command.email);
    // Unknown email and an account without a password look the same — no timing oracle.
    if (!credentials?.passwordHash) {
      await this.passwordHasher.verifyDummy(command.password);
      throw this.loginFailed(command);
    }
    if (!(await this.passwordHasher.verify(credentials.passwordHash, command.password))) {
      throw this.loginFailed(command);
    }
    if (this.passwordHasher.needsRehash(credentials.passwordHash)) {
      await this.userService.updatePasswordHash(
        credentials.id,
        await this.passwordHasher.hash(command.password),
      );
    }
    const session = await this.sessionService.start({
      userId: credentials.id,
      authorities: [credentials.role],
      ip: command.ip,
      userAgent: command.userAgent,
      presentedToken: command.presentedToken,
    });
    const user = await this.currentUser(credentials.id);
    await this.rateLimitService.reset(
      RateLimitName.LOGIN,
      loginRateLimitKey(command.ip, command.email),
    );
    this.logger.info(
      { userId: credentials.id, email: command.email, ip: command.ip },
      'Login succeeded',
    );
    return { user, session };
  }

  logout(principal: Principal): Promise<void> {
    return this.sessionService.end(principal.sessionId);
  }

  async currentUser(userId: string): Promise<UserProfile> {
    const user = await this.userService.findProfileById(userId);
    if (!user) {
      // Sessions cascade with their user, so this only happens in a race with deletion.
      throw new NotAuthenticatedException();
    }
    return user;
  }

  private loginFailed(command: LoginCommand): InvalidCredentialsException {
    this.metrics.failedLogins.inc();
    this.logger.warn({ email: command.email, ip: command.ip }, 'Login failed');
    return new InvalidCredentialsException();
  }
}
