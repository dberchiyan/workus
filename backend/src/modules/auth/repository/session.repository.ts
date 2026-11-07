import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import {
  type SessionAuthenticationRecord,
  sessionAuthenticationSelect,
  type SessionListRecord,
  sessionListSelect,
} from './record/session.record';

export interface NewSession {
  userId: string;
  tokenHash: string;
  csrfTokenHash: string;
  authorities: string[];
  clientType: string;
  ip: string;
  userAgent: string | null;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

/** Sessions trimmed per sign-in at most (normally one). */
const MAX_TRIMMED = 100;

@Injectable()
export class SessionRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  findForAuthenticationByTokenHash(tokenHash: string): Promise<SessionAuthenticationRecord | null> {
    return this.txHost.tx.session.findUnique({
      where: { tokenHash },
      select: sessionAuthenticationSelect,
    });
  }

  findListedById(id: string): Promise<SessionListRecord | null> {
    return this.txHost.tx.session.findUnique({ where: { id }, select: sessionListSelect });
  }

  /** The user's other live sessions, most recently used first, a page at a time. */
  async findOtherLivePage(
    userId: string,
    exceptId: string,
    now: Date,
    page: { skip: number; take: number },
  ): Promise<{ content: SessionListRecord[]; totalElements: number }> {
    const where: Prisma.SessionWhereInput = {
      userId,
      id: { not: exceptId },
      idleExpiresAt: { gt: now },
      absoluteExpiresAt: { gt: now },
    };
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.session.count({ where }),
      this.txHost.tx.session.findMany({
        where,
        select: sessionListSelect,
        orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
        skip: page.skip,
        take: page.take,
      }),
    ]);
    return { content, totalElements };
  }

  /**
   * Keeps the user's `keep` most recently used sessions and deletes the rest (bounded: a few
   * extra rows at most, since every sign-in trims).
   */
  async deleteBeyondMostRecent(userId: string, keep: number): Promise<number> {
    const stale = await this.txHost.tx.session.findMany({
      where: { userId },
      select: { id: true },
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
      skip: keep,
      take: MAX_TRIMMED,
    });
    if (stale.length === 0) {
      return 0;
    }
    const { count } = await this.txHost.tx.session.deleteMany({
      where: { id: { in: stale.map((session) => session.id) } },
    });
    return count;
  }

  /** Ends the user's sessions except one. */
  async deleteByUserIdExcept(userId: string, keepId: string): Promise<number> {
    const { count } = await this.txHost.tx.session.deleteMany({
      where: { userId, id: { not: keepId } },
    });
    return count;
  }

  async create(session: NewSession): Promise<void> {
    await this.txHost.tx.session.create({
      data: {
        userId: session.userId,
        tokenHash: session.tokenHash,
        csrfTokenHash: session.csrfTokenHash,
        authorities: session.authorities,
        clientType: session.clientType,
        ip: session.ip,
        userAgent: session.userAgent,
        idleExpiresAt: session.idleExpiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
      },
      select: { id: true },
    });
  }

  async touch(id: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    await this.txHost.tx.session.updateMany({ where: { id }, data: { lastSeenAt, idleExpiresAt } });
  }

  async deleteById(id: string): Promise<void> {
    await this.txHost.tx.session.deleteMany({ where: { id } });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.txHost.tx.session.deleteMany({ where: { tokenHash } });
  }

  async deleteByUserIds(userIds: string[]): Promise<number> {
    if (userIds.length === 0) {
      return 0;
    }
    const { count } = await this.txHost.tx.session.deleteMany({
      where: { userId: { in: userIds } },
    });
    return count;
  }

  async deleteExpired(now: Date): Promise<number> {
    const { count } = await this.txHost.tx.session.deleteMany({
      where: { OR: [{ idleExpiresAt: { lte: now } }, { absoluteExpiresAt: { lte: now } }] },
    });
    return count;
  }
}
