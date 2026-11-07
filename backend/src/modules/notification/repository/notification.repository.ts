import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import type { NotificationSortField } from '../service/notification-sort';
import { type NotificationRecord, notificationSelect } from './record/notification.record';

export interface NewNotificationRow {
  recipientUserId: string;
  type: string;
  actorUserId: string | null;
  subjectType: string;
  subjectId: string;
  params: Prisma.InputJsonValue;
}

const orderByFor = (
  _field: NotificationSortField,
  direction: Prisma.SortOrder,
): Prisma.NotificationOrderByWithRelationInput[] => [{ createdAt: direction }];

@Injectable()
export class NotificationRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** One statement; joins the caller's transaction, so notices commit with the change. */
  async createMany(rows: NewNotificationRow[]): Promise<void> {
    if (rows.length > 0) {
      await this.txHost.tx.notification.createMany({ data: rows });
    }
  }

  async findPageByRecipient(
    recipientUserId: string,
    pageable: Pageable<NotificationSortField>,
  ): Promise<{ content: NotificationRecord[]; totalElements: number }> {
    const where = { recipientUserId } satisfies Prisma.NotificationWhereInput;
    const page = toPrismaPage(pageable, orderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.notification.count({ where }),
      this.txHost.tx.notification.findMany({ where, select: notificationSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  countUnread(recipientUserId: string): Promise<number> {
    return this.txHost.tx.notification.count({ where: { recipientUserId, readAt: null } });
  }

  /** Marks one of the recipient's notifications read (an earlier read time is kept). */
  async markRead(
    id: string,
    recipientUserId: string,
    at: Date,
  ): Promise<NotificationRecord | null> {
    await this.txHost.tx.notification.updateMany({
      where: { id, recipientUserId, readAt: null },
      data: { readAt: at },
    });
    return this.txHost.tx.notification.findFirst({
      where: { id, recipientUserId },
      select: notificationSelect,
    });
  }

  async markAllRead(recipientUserId: string, at: Date): Promise<number> {
    const { count } = await this.txHost.tx.notification.updateMany({
      where: { recipientUserId, readAt: null },
      data: { readAt: at },
    });
    return count;
  }

  /** `recipient:subject` pairs that already got a notice of this type since the instant. */
  async findSentSince(
    type: string,
    subjectIds: string[],
    since: Date,
  ): Promise<{ recipientUserId: string; subjectId: string }[]> {
    if (subjectIds.length === 0) {
      return [];
    }
    return this.txHost.tx.notification.findMany({
      where: { type, subjectId: { in: subjectIds }, createdAt: { gte: since } },
      select: { recipientUserId: true, subjectId: true },
      // At most 10 responsible people a request.
      take: subjectIds.length * 10,
    });
  }

  async deleteCreatedBefore(before: Date): Promise<number> {
    const { count } = await this.txHost.tx.notification.deleteMany({
      where: { createdAt: { lt: before } },
    });
    return count;
  }
}
