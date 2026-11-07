import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import type { AuditEventSortField } from '../service/audit-sort';
import { AuditAction, AuditTargetType } from '../service/audit-action';
import {
  auditEventSelect,
  type AuditEventRecord,
  type SecurityEventRecord,
  securityEventSelect,
} from './record/audit-event.record';

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

  /** One statement for several events (e.g. reviews canceled by a termination). */
  async createMany(rows: NewAuditEventRow[]): Promise<void> {
    if (rows.length > 0) {
      await this.txHost.tx.auditEvent.createMany({ data: rows });
    }
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

  /** A user's security log, newest first; `actions` narrows it to some actions. */
  async findSecurityPage(
    userId: string,
    actions: readonly string[] | null,
    pageable: Pageable<AuditEventSortField>,
  ): Promise<{ content: SecurityEventRecord[]; totalElements: number }> {
    const where = {
      targetType: AuditTargetType.USER,
      targetId: userId,
      ...(actions ? { action: { in: [...actions] } } : {}),
    } satisfies Prisma.AuditEventWhereInput;
    const page = toPrismaPage(pageable, orderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.auditEvent.count({ where }),
      this.txHost.tx.auditEvent.findMany({ where, select: securityEventSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  /**
   * Of these events, the sign-ins from a device the user had not signed in from before: no
   * earlier sign-in with the same browser string, version numbers ignored (an update is not a
   * new device). Raw SQL — Prisma cannot compare a column with a function of another row.
   */
  async findNewDeviceSignIns(userId: string, eventIds: readonly string[]): Promise<Set<string>> {
    if (eventIds.length === 0) {
      return new Set();
    }
    const rows = await this.txHost.tx.$queryRaw<unknown[]>`
      SELECT e.id FROM audit_events e
      WHERE e.id = ANY(${[...eventIds]}::uuid[])
        AND e.target_type = ${AuditTargetType.USER} AND e.target_id = ${userId}::uuid
        AND e.action = ${AuditAction.AUTH_SIGNED_IN} AND e.user_agent IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM audit_events p
          WHERE p.target_type = e.target_type AND p.target_id = e.target_id
            AND p.action = e.action AND p.user_agent IS NOT NULL
            AND (p.occurred_at, p.id) < (e.occurred_at, e.id)
            AND regexp_replace(p.user_agent, '[0-9]+', '', 'g')
              = regexp_replace(e.user_agent, '[0-9]+', '', 'g'))`;
    return new Set(idRowsSchema.parse(rows).map((row) => row.id));
  }

  /** Oldest first; bounded (a request has a handful of events). */
  findByTargets(targetIds: string[]): Promise<AuditEventRecord[]> {
    return this.txHost.tx.auditEvent.findMany({
      where: { targetId: { in: targetIds } },
      select: auditEventSelect,
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
      take: targetIds.length * MAX_EVENTS_PER_TARGET,
    });
  }
}

const MAX_EVENTS_PER_TARGET = 20;

const idRowsSchema = z.array(z.object({ id: z.string() }));
