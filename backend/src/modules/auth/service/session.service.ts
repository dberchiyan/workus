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
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditService } from '../../audit/service/audit.service';
import { OrganisationStatus } from '../../user/service/organisation-status';
import { EmployeeService } from '../../employee/core/service/employee.service';
import type { SessionListRecord } from '../repository/record/session.record';
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
  /** Sessions this sign-in ended (the per-user limit) — for the security log. */
  evicted: number;
}

/** Devices a person can be signed in on at once (product decision). */
const MAX_SESSIONS_PER_USER = 10;

/** Days back the hourly job looks for terminations that took effect. */
const LEAVER_WINDOW_DAYS = 7;

@Injectable()
export class SessionService extends SessionAuthenticator {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly employeeService: EmployeeService,
    private readonly auditService: AuditService,
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
    // At most MAX_SESSIONS_PER_USER devices: a new sign-in ends the least recently used one.
    const trimmed = await this.sessionRepository.deleteBeyondMostRecent(
      command.userId,
      MAX_SESSIONS_PER_USER,
    );
    if (trimmed > 0) {
      this.logger.info({ userId: command.userId, trimmed }, 'Oldest sessions ended (limit)');
    }
    return { token, csrfToken, absoluteExpiresAt, evicted: trimmed };
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
        session.user.organisationId,
        session.user.organisation.status === OrganisationStatus.ACTIVE,
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

  /** Settings: this session, and a page of the user's other live ones (most recent first). */
  async listForUser(
    userId: string,
    currentSessionId: string,
    page: { page: number; size: number },
  ): Promise<{
    current: SessionListRecord | null;
    others: { content: SessionListRecord[]; totalElements: number };
  }> {
    const [current, others] = await Promise.all([
      this.sessionRepository.findListedById(currentSessionId),
      this.sessionRepository.findOtherLivePage(userId, currentSessionId, new Date(), {
        skip: page.page * page.size,
        take: page.size,
      }),
    ]);
    return { current, others };
  }

  /** Signs the user out everywhere but this session. */
  endOthers(userId: string, keepSessionId: string): Promise<number> {
    return this.sessionRepository.deleteByUserIdExcept(userId, keepSessionId);
  }

  /** Signs these users out everywhere (e.g. a password change). */
  endAllForUsers(userIds: string[]): Promise<number> {
    return this.sessionRepository.deleteByUserIds(userIds);
  }

  /**
   * A role changed: authorities are a snapshot, so the person's sessions end (security.md). When
   * people change their own role, the session they did it from stays, with the new authorities.
   */
  @Transactional()
  async applyRoleChange(
    userId: string,
    authorities: string[],
    keepSessionId: string | null,
  ): Promise<void> {
    if (keepSessionId === null) {
      await this.sessionRepository.deleteByUserIds([userId]);
      return;
    }
    await this.sessionRepository.deleteByUserIdExcept(userId, keepSessionId);
    await this.sessionRepository.updateAuthorities(keepSessionId, authorities);
  }

  /**
   * Their employment has ended: every session of these users ends, and each one who had any
   * gets a security-log entry (actor: the admin terminating, or nobody for the daily job).
   */
  @Transactional()
  async endForTermination(
    users: { userId: string; organisationId: string }[],
    actorUserId?: string | null,
  ): Promise<number> {
    const signedIn = new Set(
      await this.sessionRepository.findUserIdsWithSessions(users.map((user) => user.userId)),
    );
    const leavers = users.filter((user) => signedIn.has(user.userId));
    if (leavers.length === 0) {
      return 0;
    }
    const count = await this.sessionRepository.deleteByUserIds([...signedIn]);
    await this.auditService.recordMany(
      leavers.map(({ userId, organisationId }) => ({
        action: AuditAction.AUTH_SESSIONS_ENDED_ON_TERMINATION,
        organisationId,
        ...(actorUserId === undefined ? {} : { actorUserId }),
        employeeId: null,
        target: { type: AuditTargetType.USER, id: userId, label: 'account' },
        changes: [],
      })),
    );
    return count;
  }

  /**
   * A termination dated ahead takes effect on its day: sessions of people whose employment ended
   * in the last few days are ended (a missed run is caught up; sign-in refuses them anyway).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async endForLeavers(): Promise<void> {
    const count = await this.endForTermination(
      await this.employeeService.usersWhoLeftWithin(LEAVER_WINDOW_DAYS),
      null,
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
