import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { Pageable, SortDirection } from '../../../../common/dto/pageable';
import { toPrismaPage } from '../../../../common/persistence/pageable';
import type { PrismaService } from '../../../../common/persistence/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type { EmployeeSortField } from '../service/employee-sort';
import type { EmployeeCriteria } from '../service/filter/employee.criteria';
import { activeOn, employeeWhere } from './employee-where';
import {
  type EmployeeListItemRecord,
  employeeListItemSelect,
  type EmployeeProfileRecord,
  employeeProfileSelect,
  type PositionOptionRecord,
  positionOptionSelect,
  type ResponsibleCandidateRecord,
  responsibleCandidateSelect,
} from './record/employee.record';

const orderByFor = (
  field: EmployeeSortField,
  direction: SortDirection,
): Prisma.EmployeeOrderByWithRelationInput[] =>
  field === 'name'
    ? [{ user: { firstName: direction } }, { user: { lastName: direction } }]
    : [{ startDate: direction }];

/** Bounded lists for pickers. */
const MAX_POSITIONS = 200;
const MAX_CANDIDATES = 20;

export interface NewEmployee {
  userId: string;
  positionId: string;
  startDate: Date;
  mobile: string | undefined;
  personalEmail: string | undefined;
  linkedinUrl: string | undefined;
  telegram: string | undefined;
  address: string | undefined;
  responsibleUserIds: string[];
  createdBy: string;
}

/** Admins, plus users whose employee record is active today. */
const responsibleCandidateWhere = (today: Date): Prisma.UserWhereInput => ({
  OR: [{ role: 'ADMIN' }, { employee: activeOn(today) }],
});

const averageRowsSchema = z.array(z.object({ days: z.number() }));

@Injectable()
export class EmployeeRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  async findPage(
    criteria: EmployeeCriteria,
    pageable: Pageable<EmployeeSortField>,
  ): Promise<{ content: EmployeeListItemRecord[]; totalElements: number }> {
    const where = employeeWhere(criteria);
    const page = toPrismaPage(pageable, orderByFor, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.employee.count({ where }),
      this.txHost.tx.employee.findMany({ where, select: employeeListItemSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  countActive(today: Date): Promise<number> {
    return this.txHost.tx.employee.count({ where: activeOn(today) });
  }

  /** Hires with a start date in (from, to]. */
  countStartedBetween(from: Date, to: Date): Promise<number> {
    return this.txHost.tx.employee.count({ where: { startDate: { gt: from, lte: to } } });
  }

  /** Mean days since start over active employees; 0 when there are none. AVG over dates is raw SQL. */
  async averageTenureDays(today: Date): Promise<number> {
    const rows = await this.txHost.tx.$queryRaw<unknown[]>`
      SELECT COALESCE(AVG(${today}::date - start_date), 0)::float8 AS days
      FROM employees
      WHERE terminated_on IS NULL OR terminated_on > ${today}::date`;
    const [row] = averageRowsSchema.parse(rows);
    return row?.days ?? 0;
  }

  countActiveWithoutResponsible(today: Date): Promise<number> {
    return this.txHost.tx.employee.count({
      where: { AND: [activeOn(today), { responsibles: { none: {} } }] },
    });
  }

  /** Terminations dated in (from, to]. */
  countTerminatedBetween(from: Date, to: Date): Promise<number> {
    return this.txHost.tx.employee.count({ where: { terminatedOn: { gt: from, lte: to } } });
  }

  /** Matching employees per position (the tab counts are summed per category by the service). */
  async countByPosition(
    criteria: Omit<EmployeeCriteria, 'categoryId'>,
  ): Promise<Map<string, number>> {
    const groups = await this.txHost.tx.employee.groupBy({
      by: ['positionId'],
      where: employeeWhere(criteria),
      _count: { _all: true },
      orderBy: { positionId: 'asc' },
    });
    return new Map(groups.map((group) => [group.positionId, group._count._all]));
  }

  async create(employee: NewEmployee): Promise<string> {
    const { id } = await this.txHost.tx.employee.create({
      data: {
        userId: employee.userId,
        positionId: employee.positionId,
        startDate: employee.startDate,
        mobile: employee.mobile ?? null,
        personalEmail: employee.personalEmail ?? null,
        linkedinUrl: employee.linkedinUrl ?? null,
        telegram: employee.telegram ?? null,
        address: employee.address ?? null,
        createdBy: employee.createdBy,
        updatedBy: employee.createdBy,
        responsibles: {
          create: employee.responsibleUserIds.map((responsibleUserId) => ({
            responsibleUserId,
            createdBy: employee.createdBy,
          })),
        },
      },
      select: { id: true },
    });
    return id;
  }

  findProfileById(id: string): Promise<EmployeeProfileRecord | null> {
    return this.txHost.tx.employee.findUnique({ where: { id }, select: employeeProfileSelect });
  }

  async existsById(id: string): Promise<boolean> {
    return (await this.txHost.tx.employee.count({ where: { id } })) > 0;
  }

  findListItemById(id: string): Promise<EmployeeListItemRecord | null> {
    return this.txHost.tx.employee.findUnique({ where: { id }, select: employeeListItemSelect });
  }

  async positionExists(id: string): Promise<boolean> {
    return (await this.txHost.tx.position.count({ where: { id } })) > 0;
  }

  findPositionOptions(): Promise<PositionOptionRecord[]> {
    return this.txHost.tx.position.findMany({
      select: positionOptionSelect,
      orderBy: [{ category: { sortOrder: 'asc' } }, { title: 'asc' }],
      take: MAX_POSITIONS,
    });
  }

  findResponsibleCandidates(
    searchTerms: string[],
    today: Date,
  ): Promise<ResponsibleCandidateRecord[]> {
    return this.txHost.tx.user.findMany({
      where: {
        AND: [
          responsibleCandidateWhere(today),
          ...searchTerms.map((term): Prisma.UserWhereInput => ({
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          })),
        ],
      },
      select: responsibleCandidateSelect,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
      take: MAX_CANDIDATES,
    });
  }

  async countResponsibleCandidates(userIds: string[], today: Date): Promise<number> {
    return this.txHost.tx.user.count({
      where: { AND: [{ id: { in: userIds } }, responsibleCandidateWhere(today)] },
    });
  }
}
