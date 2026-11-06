import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import {
  type SessionAuthenticationRecord,
  sessionAuthenticationSelect,
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

  async deleteExpired(now: Date): Promise<number> {
    const { count } = await this.txHost.tx.session.deleteMany({
      where: { OR: [{ idleExpiresAt: { lte: now } }, { absoluteExpiresAt: { lte: now } }] },
    });
    return count;
  }
}
