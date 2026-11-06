import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import type { AuditEventSortField } from '../service/audit-sort';
import { auditEventSelect, type AuditEventRecord } from './record/audit-event.record';

export interface NewAuditEventRow {
  action: string;
  actorUserId: string | null;
  employeeId: string | null;
  targetType: string;
  targetId: string;
  targetLabel: string;
  changes: Prisma.InputJsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string | null;
}

const orderByFor = (
  _field: AuditEventSortField,
  direction: Prisma.SortOrder,
): Prisma.AuditEventOrderByWithRelationInput[] => [{ occurredAt: direction }];

@Injectable()
export class AuditEventRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** Joins the caller's transaction: the event commits (or rolls back) with the change. */
  async create(row: NewAuditEventRow): Promise<void> {
    await this.txHost.tx.auditEvent.create({ data: row, select: { id: true } });
  }

  async findPageByEmployee(
    employeeId: string,
    pageable: Pageable<AuditEventSortField>,
  ): Promise<{ content: AuditEventRecord[]; totalElements: number }> {
    const where = { employeeId } satisfies Prisma.AuditEventWhereInput;
    const page = toPrismaPage(pageable, orderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.auditEvent.count({ where }),
      this.txHost.tx.auditEvent.findMany({ where, select: auditEventSelect, ...page }),
    ]);
    return { content, totalElements };
  }
}
