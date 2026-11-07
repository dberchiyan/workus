import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import { HOLDING_STATUSES, TimeOffStatus } from '../service/time-off-type';
import { RequestState, type TimeOffRequestCriteria } from '../service/time-off-request.criteria';
import type { ManagedRequestSortField, TimeOffRequestSortField } from '../service/time-off-sort';
import {
  type AbsenceRecord,
  absenceSelect,
  type CalendarRequestRecord,
  calendarRequestSelect,
  type DashboardRequestRecord,
  dashboardRequestSelect,
  type HeldDaysRecord,
  heldDaysSelect,
  type ManagedTimeOffRequestRecord,
  managedTimeOffRequestSelect,
  type RequestStateRecord,
  requestStateSelect,
  type TimeOffCommentRecord,
  timeOffCommentSelect,
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

const managedWhere = (criteria: TimeOffRequestCriteria): Prisma.TimeOffRequestWhereInput => ({
  AND: [
    criteria.state === RequestState.PENDING
      ? { status: TimeOffStatus.PENDING }
      : { status: criteria.status ?? { not: TimeOffStatus.PENDING } },
    ...(criteria.type ? [{ type: criteria.type }] : []),
    ...(criteria.responsibleUserId
      ? [{ responsibles: { some: { responsibleUserId: criteria.responsibleUserId } } }]
      : []),
    ...criteria.searchTerms.map((term): Prisma.TimeOffRequestWhereInput => ({
      employee: {
        user: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    })),
  ],
});

const managedOrderByFor = (
  field: ManagedRequestSortField,
  direction: Prisma.SortOrder,
): Prisma.TimeOffRequestOrderByWithRelationInput[] => [{ [field]: direction }];

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

  /** Every employee's requests (admin), filtered. */
  async findManagedPage(
    criteria: TimeOffRequestCriteria,
    pageable: Pageable<ManagedRequestSortField>,
  ): Promise<{ content: ManagedTimeOffRequestRecord[]; totalElements: number }> {
    const where = managedWhere(criteria);
    const page = toPrismaPage(pageable, managedOrderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.timeOffRequest.count({ where }),
      this.txHost.tx.timeOffRequest.findMany({
        where,
        select: managedTimeOffRequestSelect,
        ...page,
      }),
    ]);
    return { content, totalElements };
  }

  findManagedById(id: string): Promise<ManagedTimeOffRequestRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id },
      select: managedTimeOffRequestSelect,
    });
  }

  findStateById(id: string): Promise<RequestStateRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({ where: { id }, select: requestStateSelect });
  }

  addComment(requestId: string, authorId: string, body: string): Promise<TimeOffCommentRecord> {
    return this.txHost.tx.timeOffRequestComment.create({
      data: { requestId, authorId, body },
      select: timeOffCommentSelect,
    });
  }

  /** Comments mark the request as changed, so "changed today" lists pick them up. */
  async touch(id: string, updatedBy: string): Promise<void> {
    await this.txHost.tx.timeOffRequest.update({
      where: { id },
      data: { updatedBy },
      select: { id: true },
    });
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

  /**
   * Moves from `fromStatus` only; false → it is no longer in that status (changed meanwhile).
   * `decided` records the actor as the one who approved or rejected it.
   */
  async changeStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    updatedBy: string,
    decided = false,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.timeOffRequest.updateMany({
      where: { id, status: fromStatus },
      data: {
        status: toStatus,
        updatedBy,
        version: { increment: 1 },
        ...(decided ? { decidedBy: updatedBy, decidedAt: new Date() } : {}),
      },
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

  /**
   * Approved and pending requests of these employees that touch [from, to], of the given types.
   * Holding requests of one person never overlap, so a month holds at most one per day each.
   */
  findCalendarRequests(
    employeeIds: string[],
    from: Date,
    to: Date,
    types: readonly string[],
  ): Promise<CalendarRequestRecord[]> {
    if (employeeIds.length === 0 || types.length === 0) {
      return Promise.resolve([]);
    }
    return this.txHost.tx.timeOffRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: { in: [...HOLDING_STATUSES] },
        type: { in: [...types] },
        startDate: { lte: to },
        endDate: { gte: from },
      },
      select: calendarRequestSelect,
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: employeeIds.length * MAX_DAYS_IN_MONTH,
    });
  }

  /** Requests made in [from, to) of any status, newest first. */
  async findCreatedBetween(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<{ content: DashboardRequestRecord[]; totalElements: number }> {
    const where: Prisma.TimeOffRequestWhereInput = { createdAt: { gte: from, lt: to } };
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.timeOffRequest.count({ where }),
      this.txHost.tx.timeOffRequest.findMany({
        where,
        select: dashboardRequestSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      }),
    ]);
    return { content, totalElements };
  }
}

/** One request per person per day at most. */
const MAX_DAYS_IN_MONTH = 31;

/** A company has a bounded number of people off in one week. */
const MAX_ABSENCES = 500;
