import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AccessEndedException,
  BusinessRuleException,
  InvalidCredentialsException,
  NotAuthenticatedException,
} from '../../../common/exception/api.exception';
import type { Pageable } from '../../../common/dto/pageable';
import { MetricsService } from '../../../common/observability/metrics.service';
import type { Principal } from '../../../common/security/principal';
import { loginRateLimitKey, RateLimitName } from '../../../common/security/rate-limit';
import { RateLimitService } from '../../../common/security/rate-limit.service';
import { EmployeeService } from '../../employee/core/service/employee.service';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import type { AuditEventSortField } from '../../audit/service/audit-sort';
import { AuditService } from '../../audit/service/audit.service';
import type { SecurityEventPage } from '../../audit/service/audit.types';
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

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ip: string;
  userAgent: string | null;
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
    private readonly employeeService: EmployeeService,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditService: AuditService,
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
      // A wrong password for a real account goes to its owner's security log.
      await this.security(AuditAction.AUTH_SIGN_IN_FAILED, credentials.id, null);
      // That was the last allowed try from this IP: sign-in is now blocked there for a while.
      if (
        await this.rateLimitService.isExhausted(
          RateLimitName.LOGIN,
          loginRateLimitKey(command.ip, command.email),
        )
      ) {
        await this.security(AuditAction.AUTH_SIGN_IN_LOCKED, credentials.id, null);
      }
      throw this.loginFailed(command);
    }
    // Checked only after the password, so it tells nothing to someone who does not know it.
    if (await this.employeeService.hasAccessEnded(credentials.id)) {
      this.logger.warn({ userId: credentials.id, ip: command.ip }, 'Login refused: access ended');
      await this.security(AuditAction.AUTH_SIGN_IN_REFUSED, credentials.id, credentials.id);
      throw new AccessEndedException();
    }
    if (this.passwordHasher.needsRehash(credentials.passwordHash)) {
      await this.userService.updatePasswordHash(
        credentials.id,
        await this.passwordHasher.hash(command.password),
      );
    }
    const session = await this.startSession(credentials.id, credentials.role, command);
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

  /**
   * Changes the caller's password. The current one is checked first (rate-limited per user);
   * then every session of the user ends — this browser gets a fresh one (security.md →
   * Passwords: a password change deletes all sessions).
   */
  async changePassword(command: ChangePasswordCommand): Promise<StartedSession> {
    const credentials = await this.userService.findCredentialsById(command.userId);
    if (
      !credentials?.passwordHash ||
      !(await this.passwordHasher.verify(credentials.passwordHash, command.currentPassword))
    ) {
      this.logger.warn({ userId: command.userId, ip: command.ip }, 'Password change refused');
      throw new BusinessRuleException('errors.auth.currentPasswordWrong', {}, 'currentPassword');
    }
    if (command.currentPassword === command.newPassword) {
      throw new BusinessRuleException('errors.auth.samePassword', {}, 'newPassword');
    }
    // Hashing is CPU work, done before the transaction opens.
    const passwordHash = await this.passwordHasher.hash(command.newPassword);
    const session = await this.replacePassword(
      credentials.id,
      credentials.role,
      passwordHash,
      command,
    );
    await this.rateLimitService.reset(RateLimitName.PASSWORD_CHANGE, [credentials.id]);
    this.logger.info({ userId: credentials.id, ip: command.ip }, 'Password changed');
    return session;
  }

  /** The session and its security-log entry, together. */
  @Transactional()
  private async startSession(
    userId: string,
    role: string,
    command: LoginCommand,
  ): Promise<StartedSession> {
    const session = await this.sessionService.start({
      userId,
      authorities: [role],
      ip: command.ip,
      userAgent: command.userAgent,
      presentedToken: command.presentedToken,
    });
    await this.security(AuditAction.AUTH_SIGNED_IN, userId, userId);
    if (session.evicted > 0) {
      await this.security(AuditAction.AUTH_SESSION_EVICTED, userId, userId);
    }
    return session;
  }

  /** The new hash, every old session gone and a new one for this browser — all or nothing. */
  @Transactional()
  private async replacePassword(
    userId: string,
    role: string,
    passwordHash: string,
    command: ChangePasswordCommand,
  ): Promise<StartedSession> {
    await this.userService.updatePasswordHash(userId, passwordHash);
    await this.sessionService.endAllForUsers([userId]);
    const session = await this.sessionService.start({
      userId,
      authorities: [role],
      ip: command.ip,
      userAgent: command.userAgent,
      presentedToken: undefined,
    });
    await this.security(AuditAction.AUTH_PASSWORD_CHANGED, userId, userId);
    return session;
  }

  @Transactional()
  async logout(principal: Principal): Promise<void> {
    await this.sessionService.end(principal.sessionId);
    await this.security(AuditAction.AUTH_SIGNED_OUT, principal.userId, principal.userId);
  }

  /** Ends one of the caller's sessions (the policy checked it is theirs). */
  @Transactional()
  async endSession(principal: Principal, sessionId: string): Promise<void> {
    await this.sessionService.end(sessionId);
    await this.security(
      sessionId === principal.sessionId
        ? AuditAction.AUTH_SIGNED_OUT
        : AuditAction.AUTH_SESSION_ENDED,
      principal.userId,
      principal.userId,
    );
  }

  /** Signs the caller out everywhere else; logged when anything ended. */
  @Transactional()
  async endOtherSessions(principal: Principal): Promise<void> {
    if ((await this.sessionService.endOthers(principal.userId, principal.sessionId)) > 0) {
      await this.security(
        AuditAction.AUTH_OTHER_SESSIONS_ENDED,
        principal.userId,
        principal.userId,
      );
    }
  }

  /** The caller's security log, newest first. */
  securityLog(userId: string, pageable: Pageable<AuditEventSortField>): Promise<SecurityEventPage> {
    return this.auditService.findSecurityPage(userId, pageable);
  }

  /** One security-log entry about `userId`; IP and browser come from the request context. */
  private security(action: AuditAction, userId: string, actorUserId: string | null): Promise<void> {
    return this.auditService.record({
      action,
      actorUserId,
      employeeId: null,
      target: { type: AuditTargetType.USER, id: userId, label: 'account' },
      changes: [],
    });
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
