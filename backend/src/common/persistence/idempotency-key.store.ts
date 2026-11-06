import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '../../generated/prisma/client';
import { classifyPrismaError, PrismaErrorKind } from './prisma-error';
import { PrismaService } from './prisma.service';

export interface StoredResponse {
  statusCode: number;
  body: unknown;
}

export type ClaimResult =
  | { outcome: 'CLAIMED'; id: string }
  | { outcome: 'REPLAY'; response: StoredResponse }
  | { outcome: 'IN_PROGRESS' }
  | { outcome: 'REUSED' };

export interface ClaimRequest {
  key: string;
  userId: string;
  endpoint: string;
  requestHash: string;
  expiresAt: Date;
}

/**
 * The idempotency ledger. Uses the root client on purpose: a claim must commit before the
 * handler's own transaction starts, so a concurrent duplicate sees it.
 */
@Injectable()
export class IdempotencyKeyStore {
  constructor(private readonly prisma: PrismaService) {}

  async claim(request: ClaimRequest): Promise<ClaimResult> {
    try {
      const { id } = await this.prisma.idempotencyKey.create({
        data: {
          key: request.key,
          userId: request.userId,
          endpoint: request.endpoint,
          requestHash: request.requestHash,
          expiresAt: request.expiresAt,
        },
        select: { id: true },
      });
      return { outcome: 'CLAIMED', id };
    } catch (error) {
      if (classifyPrismaError(error) !== PrismaErrorKind.UNIQUE_VIOLATION) {
        throw error;
      }
    }
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId: request.userId, key: request.key } },
      select: {
        id: true,
        endpoint: true,
        requestHash: true,
        statusCode: true,
        responseBody: true,
        expiresAt: true,
      },
    });
    if (!existing) {
      // Released between our insert and read (the first attempt failed): claim again.
      return this.claim(request);
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.prisma.idempotencyKey.deleteMany({ where: { id: existing.id } });
      return this.claim(request);
    }
    if (existing.endpoint !== request.endpoint || existing.requestHash !== request.requestHash) {
      return { outcome: 'REUSED' };
    }
    if (existing.statusCode === null) {
      return { outcome: 'IN_PROGRESS' };
    }
    return {
      outcome: 'REPLAY',
      response: { statusCode: existing.statusCode, body: existing.responseBody },
    };
  }

  async complete(id: string, response: StoredResponse): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { id },
      data: {
        statusCode: response.statusCode,
        responseBody:
          response.body === undefined ? Prisma.JsonNull : (response.body as Prisma.InputJsonValue),
      },
      select: { id: true },
    });
  }

  /** The request failed and nothing was done: the key can be used again. */
  async release(id: string): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({ where: { id } });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpired(): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  }
}
