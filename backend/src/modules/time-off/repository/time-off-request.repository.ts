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
  type AbsenceDaysRecord,
  absenceDaysSelect,
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
  type RequestNoticeRecord,
  requestNoticeSelect,
  type RequestStateRecord,
  requestStateSelect,
  type TimeOffCommentRecord,
  timeOffCommentSelect,
  type TimeOffRequestRecord,
  timeOffRequestSelect,
} from './record/time-off-request.record';

export interface NewTimeOffRequest {
  organisationId: string;
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

const managedWhere = (
  organisationId: string,
  criteria: TimeOffRequestCriteria,
): Prisma.TimeOffRequestWhereInput => ({
  organisationId,
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
    organisationId: string,
    employeeId: string,
    changedSince: Date | undefined,
    pageable: Pageable<TimeOffRequestSortField>,
  ): Promise<{ content: TimeOffRequestRecord[]; totalElements: number }> {
    const where = {
      organisationId,
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
    organisationId: string,
    criteria: TimeOffRequestCriteria,
    pageable: Pageable<ManagedRequestSortField>,
  ): Promise<{ content: ManagedTimeOffRequestRecord[]; totalElements: number }> {
    const where = managedWhere(organisationId, criteria);
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

  findManagedById(organisationId: string, id: string): Promise<ManagedTimeOffRequestRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id, organisationId },
      select: managedTimeOffRequestSelect,
    });
  }

  findNoticeById(organisationId: string, id: string): Promise<RequestNoticeRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id, organisationId },
      select: requestNoticeSelect,
    });
  }

  /** Pending requests (of every organisation) made before the instant, oldest first (reminders). */
  findPendingCreatedBefore(before: Date, limit: number): Promise<RequestNoticeRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: { status: TimeOffStatus.PENDING, createdAt: { lt: before } },
      select: requestNoticeSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }

  findStateById(organisationId: string, id: string): Promise<RequestStateRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id, organisationId },
      select: requestStateSelect,
    });
  }

  addComment(
    organisationId: string,
    requestId: string,
    authorId: string,
    body: string,
  ): Promise<TimeOffCommentRecord> {
    return this.txHost.tx.timeOffRequestComment.create({
      data: { organisationId, requestId, authorId, body },
      select: timeOffCommentSelect,
    });
  }

  /**
   * Replaces who decides a pending request; optimistic on its status (false → no longer pending).
   */
  async replaceResponsibles(
    organisationId: string,
    id: string,
    responsibleUserIds: string[],
    updatedBy: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.timeOffRequest.updateMany({
      where: { id, organisationId, status: TimeOffStatus.PENDING },
      data: { updatedBy, version: { increment: 1 } },
    });
    if (count === 0) {
      return false;
    }
    await this.txHost.tx.timeOffRequestResponsible.deleteMany({
      where: { organisationId, requestId: id },
    });
    await this.txHost.tx.timeOffRequestResponsible.createMany({
      data: responsibleUserIds.map((responsibleUserId) => ({
        organisationId,
        requestId: id,
        responsibleUserId,
        createdBy: updatedBy,
      })),
    });
    return true;
  }

  /** The author's own comment on this request, edited; null when it is not theirs (or gone). */
  async editComment(
    organisationId: string,
    commentId: string,
    requestId: string,
    authorId: string,
    body: string,
  ): Promise<TimeOffCommentRecord | null> {
    const { count } = await this.txHost.tx.timeOffRequestComment.updateMany({
      where: { id: commentId, organisationId, requestId, authorId },
      data: { body, editedAt: new Date() },
    });
    return count === 0
      ? null
      : this.txHost.tx.timeOffRequestComment.findUnique({
          where: { id: commentId, organisationId },
          select: timeOffCommentSelect,
        });
  }

  /** Deletes the author's own comment on this request; false when it is not theirs (or gone). */
  async deleteComment(
    organisationId: string,
    commentId: string,
    requestId: string,
    authorId: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.timeOffRequestComment.deleteMany({
      where: { id: commentId, organisationId, requestId, authorId },
    });
    return count > 0;
  }

  /**
   * Keeps held (pending, approved) requests in step with holidays: each holiday (its
   * organisation and YYYY-MM-DD) that is a weekday inside a request of that organisation gives (`delta` +1, holiday removed) or takes
   * (`delta` −1, holiday added) one working day. One statement; never below zero.
   */
  async shiftDaysForHolidays(
    holidays: { organisationId: string; day: string }[],
    delta: 1 | -1,
  ): Promise<number> {
    if (holidays.length === 0) {
      return 0;
    }
    // Pairs, so a holiday of one organisation never touches another's requests.
    const organisationIds = holidays.map((holiday) => holiday.organisationId);
    const days = holidays.map((holiday) => holiday.day);
    return this.txHost.tx.$executeRaw`
      UPDATE "time_off_requests" AS r
      SET "days" = GREATEST(0, r."days" + ${delta}::int * (
        SELECT count(*)::int FROM unnest(${organisationIds}::uuid[], ${days}::date[]) AS h(org, day)
        WHERE h.org = r."organisation_id"
          AND h.day BETWEEN r."start_date" AND r."end_date" AND EXTRACT(ISODOW FROM h.day) < 6
      ))
      WHERE r."status" IN (${TimeOffStatus.PENDING}, ${TimeOffStatus.APPROVED})
        AND EXISTS (
          SELECT 1 FROM unnest(${organisationIds}::uuid[], ${days}::date[]) AS h(org, day)
          WHERE h.org = r."organisation_id"
            AND h.day BETWEEN r."start_date" AND r."end_date" AND EXTRACT(ISODOW FROM h.day) < 6
        )`;
  }

  /** Comments mark the request as changed, so "changed today" lists pick them up. */
  async touch(organisationId: string, id: string, updatedBy: string): Promise<void> {
    await this.txHost.tx.timeOffRequest.update({
      where: { id, organisationId },
      data: { updatedBy },
      select: { id: true },
    });
  }

  findById(organisationId: string, id: string): Promise<TimeOffRequestRecord | null> {
    return this.txHost.tx.timeOffRequest.findUnique({
      where: { id, organisationId },
      select: timeOffRequestSelect,
    });
  }

  /** Pending and approved requests starting in [from, to] — what balances are made of. */
  findHeldStartingBetween(
    organisationId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<HeldDaysRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: {
        organisationId,
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
  async existsHeldOverlapping(
    organisationId: string,
    employeeId: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    return (
      (await this.txHost.tx.timeOffRequest.count({
        where: {
          organisationId,
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
        organisationId: request.organisationId,
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
    organisationId: string,
    id: string,
    fromStatus: string,
    toStatus: string,
    updatedBy: string,
    decided = false,
    decisionComment: string | null = null,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.timeOffRequest.updateMany({
      where: { id, organisationId, status: fromStatus },
      data: {
        status: toStatus,
        updatedBy,
        version: { increment: 1 },
        ...(decided ? { decidedBy: updatedBy, decidedAt: new Date(), decisionComment } : {}),
      },
    });
    return count > 0;
  }

  /** Organisation-wide: how many wait for a decision, and since when the oldest one waits. */
  async pendingSummary(
    organisationId: string,
  ): Promise<{ count: number; oldestCreatedAt: Date | null }> {
    const result = await this.txHost.tx.timeOffRequest.aggregate({
      where: { organisationId, status: TimeOffStatus.PENDING },
      _count: { _all: true },
      _min: { createdAt: true },
    });
    return { count: result._count._all, oldestCreatedAt: result._min.createdAt };
  }

  /** Approved requests covering any day of [from, to], with their type (bounded). */
  findApprovedWithTypeOverlapping(
    organisationId: string,
    from: Date,
    to: Date,
  ): Promise<AbsenceDaysRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: {
        organisationId,
        status: TimeOffStatus.APPROVED,
        startDate: { lte: to },
        endDate: { gte: from },
      },
      select: absenceDaysSelect,
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: MAX_YEAR_ABSENCES,
    });
  }

  /** Approved requests covering any day of [from, to]; who (bounded) and their dates. */
  findApprovedOverlapping(organisationId: string, from: Date, to: Date): Promise<AbsenceRecord[]> {
    return this.txHost.tx.timeOffRequest.findMany({
      where: {
        organisationId,
        status: TimeOffStatus.APPROVED,
        startDate: { lte: to },
        endDate: { gte: from },
      },
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
    organisationId: string,
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
        organisationId,
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

  /** Requests made in [from, to) of any status, newest first, a page at a time. */
  async findCreatedBetween(
    organisationId: string,
    from: Date,
    to: Date,
    page: { offset: number; limit: number },
  ): Promise<{ content: DashboardRequestRecord[]; totalElements: number }> {
    const where: Prisma.TimeOffRequestWhereInput = {
      organisationId,
      createdAt: { gte: from, lt: to },
    };
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.timeOffRequest.count({ where }),
      this.txHost.tx.timeOffRequest.findMany({
        where,
        select: dashboardRequestSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: page.offset,
        take: page.limit,
      }),
    ]);
    return { content, totalElements };
  }
}

/** A year of approved requests for the whole company. */
const MAX_YEAR_ABSENCES = 20_000;

/** One request per person per day at most. */
const MAX_DAYS_IN_MONTH = 31;

/** A company has a bounded number of people off in one week. */
const MAX_ABSENCES = 500;
