import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import { HOLDING_STATUSES, TimeOffStatus } from '../service/time-off-type';
import type { TimeOffRequestSortField } from '../service/time-off-sort';
import {
  type AbsenceRecord,
  absenceSelect,
  type HeldDaysRecord,
  heldDaysSelect,
  type TimeOffRequestRecord,
  timeOffRequestSelect,
} from './record/time-off-request.record';

export interface NewTimeOffRequest {
  employeeId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  note: string | null;
  responsibleUserIds: string[];
  createdBy: string;
}

/** Requests in one window are few; bounded defensively. */
const MAX_HELD_ROWS = 500;

const orderByFor = (
  _field: TimeOffRequestSortField,
  direction: Prisma.SortOrder,
): Prisma.TimeOffRequestOrderByWithRelationInput[] => [{ createdAt: direction }];

@Injectable()
export class TimeOffRequestRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** With `changedSince`: pending ones, plus any changed at or after that instant. */
  async findPageByEmployee(
    employeeId: string,
    changedSince: Date | undefined,
    pageable: Pageable<TimeOffRequestSortField>,
  ): Promise<{ content: TimeOffRequestRecord[]; totalElements: number }> {
    const where = {
      employeeId,
      ...(changedSince
        ? { OR: [{ status: TimeOffStatus.PENDING }, { updatedAt: { gte: changedSince } }] }
        : {}),
    } satisfies Prisma.TimeOffRequestWhereInput;
    const page = toPrismaPage(pageable, orderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.timeOffRequest.count({ where }),
      this.txHost.tx.timeOffRequest.findMany({ where, select: timeOffRequestSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  findById(id: string): Promise<TimeOffRequestRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id },
      select: timeOffRequestSelect,
    });
  }

  /** Pending and approved requests starting in [from, to] — what balances are made of. */
  findHeldStartingBetween(employeeId: string, from: Date, to: Date): Promise<HeldDaysRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: {
        employeeId,
        status: { in: [...HOLDING_STATUSES] },
        startDate: { gte: from, lte: to },
      },
      select: heldDaysSelect,
      orderBy: { startDate: 'asc' },
      take: MAX_HELD_ROWS,
    });
  }

  /** Does a pending or approved request share a day with [start, end]? */
  async existsHeldOverlapping(employeeId: string, start: Date, end: Date): Promise<boolean> {
    return (
      (await this.txHost.tx.timeOffRequest.count({
        where: {
          employeeId,
          status: { in: [...HOLDING_STATUSES] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      })) > 0
    );
  }

  async create(request: NewTimeOffRequest): Promise<TimeOffRequestRecord> {
    return this.txHost.tx.timeOffRequest.create({
      data: {
        employeeId: request.employeeId,
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        days: request.days,
        status: TimeOffStatus.PENDING,
        note: request.note,
        createdBy: request.createdBy,
        updatedBy: request.createdBy,
        responsibles: {
          create: request.responsibleUserIds.map((responsibleUserId) => ({
            responsibleUserId,
            createdBy: request.createdBy,
          })),
        },
      },
      select: timeOffRequestSelect,
    });
  }

  /** Moves from `fromStatus` only; false → it is no longer in that status (changed meanwhile). */
  async changeStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    updatedBy: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.timeOffRequest.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, updatedBy, version: { increment: 1 } },
    });
    return count > 0;
  }

  /** Company-wide: how many wait for a decision, and since when the oldest one waits. */
  async pendingSummary(): Promise<{ count: number; oldestCreatedAt: Date | null }> {
    const result = await this.txHost.tx.timeOffRequest.aggregate({
      where: { status: TimeOffStatus.PENDING },
      _count: { _all: true },
      _min: { createdAt: true },
    });
    return { count: result._count._all, oldestCreatedAt: result._min.createdAt };
  }

  /** Approved requests covering any day of [from, to]; who (bounded) and their dates. */
  findApprovedOverlapping(from: Date, to: Date): Promise<AbsenceRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: { status: TimeOffStatus.APPROVED, startDate: { lte: to }, endDate: { gte: from } },
      select: absenceSelect,
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: MAX_ABSENCES,
    });
  }
}

/** A company has a bounded number of people off in one week. */
const MAX_ABSENCES = 500;
