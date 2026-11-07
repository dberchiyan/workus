import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '../../../common/config/app-config.service';
import { ClientType, Principal } from '../../../common/security/principal';
import {
  type SessionAuthentication,
  SessionAuthenticator,
  SessionLookup,
} from '../../../common/security/session-authenticator';
import { generateToken, hashToken } from '../../../common/security/token-hash';
import { EmployeeService } from '../../employee/core/service/employee.service';
import { SessionRepository } from '../repository/session.repository';

const MINUTE_MS = 60_000;
/** security.md: last_seen_at is written at most once a minute. */
const TOUCH_INTERVAL_MS = MINUTE_MS;

export interface StartSessionCommand {
  userId: string;
  authorities: string[];
  ip: string;
  userAgent: string | null;
  /** Token of a session presented at login — deleted, never reused (no fixation). */
  presentedToken: string | undefined;
}

export interface StartedSession {
  token: string;
  csrfToken: string;
  absoluteExpiresAt: Date;
}

/** Days back the hourly job looks for terminations that took effect. */
const LEAVER_WINDOW_DAYS = 7;

@Injectable()
export class SessionService extends SessionAuthenticator {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly employeeService: EmployeeService,
    private readonly config: AppConfigService,
    @InjectPinoLogger(SessionService.name) private readonly logger: PinoLogger,
  ) {
    super();
  }

  @Transactional()
  async start(command: StartSessionCommand): Promise<StartedSession> {
    if (command.presentedToken) {
      await this.sessionRepository.deleteByTokenHash(hashToken(command.presentedToken));
    }
    const token = generateToken();
    const csrfToken = generateToken();
    const now = Date.now();
    const absoluteExpiresAt = new Date(
      now + this.config.get('SESSION_ABSOLUTE_TIMEOUT_MINUTES') * MINUTE_MS,
    );
    await this.sessionRepository.create({
      userId: command.userId,
      tokenHash: hashToken(token),
      csrfTokenHash: hashToken(csrfToken),
      authorities: command.authorities,
      clientType: ClientType.WEB,
      ip: command.ip,
      userAgent: command.userAgent,
      idleExpiresAt: this.idleExpiry(now, absoluteExpiresAt),
      absoluteExpiresAt,
    });
    return { token, csrfToken, absoluteExpiresAt };
  }

  async authenticate(token: string): Promise<SessionAuthentication> {
    const session = await this.sessionRepository.findForAuthenticationByTokenHash(hashToken(token));
    if (!session) {
      return { result: SessionLookup.UNKNOWN };
    }
    const now = Date.now();
    if (session.idleExpiresAt.getTime() <= now || session.absoluteExpiresAt.getTime() <= now) {
      await this.sessionRepository.deleteById(session.id);
      return { result: SessionLookup.EXPIRED };
    }
    if (now - session.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
      await this.sessionRepository.touch(
        session.id,
        new Date(now),
        this.idleExpiry(now, session.absoluteExpiresAt),
      );
    }
    return {
      result: SessionLookup.VALID,
      principal: new Principal(
        session.userId,
        session.id,
        session.authorities,
        session.clientType === ClientType.MOBILE ? ClientType.MOBILE : ClientType.WEB,
        session.csrfTokenHash,
      ),
    };
  }

  end(sessionId: string): Promise<void> {
    return this.sessionRepository.deleteById(sessionId);
  }

  /** Signs these users out everywhere (e.g. their employment has ended). */
  endAllForUsers(userIds: string[]): Promise<number> {
    return this.sessionRepository.deleteByUserIds(userIds);
  }

  /**
   * A termination dated ahead takes effect on its day: sessions of people whose employment ended
   * in the last few days are ended (a missed run is caught up; sign-in refuses them anyway).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async endForLeavers(): Promise<void> {
    const count = await this.endAllForUsers(
      await this.employeeService.usersWhoLeftWithin(LEAVER_WINDOW_DAYS),
    );
    if (count > 0) {
      this.logger.info({ count }, 'Sessions of people who left ended');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpired(): Promise<void> {
    const count = await this.sessionRepository.deleteExpired(new Date());
    this.logger.info({ count }, 'Expired sessions deleted');
  }

  private idleExpiry(now: number, absoluteExpiresAt: Date): Date {
    const idle = now + this.config.get('SESSION_IDLE_TIMEOUT_MINUTES') * MINUTE_MS;
    return new Date(Math.min(idle, absoluteExpiresAt.getTime()));
  }
}
