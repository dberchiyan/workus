import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable, SortDirection } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import type {
  CompanyPeople,
  CompanySortField,
  CompanyUserSortField,
} from '../service/company-sort';
import {
  type CompanyRecord,
  companySelect,
  type CompanyUserRecord,
  companyUserSelect,
} from './record/company.record';

const companyOrderBy = (
  field: CompanySortField,
  direction: SortDirection,
): Prisma.OrganisationOrderByWithRelationInput[] => [{ [field]: direction }];

const userOrderBy = (
  _field: CompanyUserSortField,
  direction: SortDirection,
): Prisma.UserOrderByWithRelationInput[] => [{ firstName: direction }, { lastName: direction }];

const nameTerms = (terms: string[]) =>
  terms.map((term) => ({ name: { contains: term, mode: 'insensitive' as const } }));

/** Owners, admins, or everyone else (employees and managers). */
const peopleWhere = (people: CompanyPeople | null): Prisma.UserWhereInput =>
  people === null
    ? {}
    : people === 'EMPLOYEE'
      ? { role: { in: ['EMPLOYEE', 'MANAGER'] } }
      : { role: people };

/**
 * Platform administration: the one repository that reads across organisations on purpose (a
 * platform admin sees every company). Never the platform's own organisation; directory facts only.
 */
@Injectable()
export class CompanyRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  async findPage(
    criteria: { status: string; searchTerms: string[]; today: Date },
    pageable: Pageable<CompanySortField>,
  ): Promise<{ content: CompanyRecord[]; totalElements: number }> {
    const where: Prisma.OrganisationWhereInput = {
      isPlatform: false,
      status: criteria.status,
      AND: nameTerms(criteria.searchTerms),
    };
    const page = toPrismaPage(pageable, companyOrderBy, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.organisation.count({ where }),
      this.txHost.tx.organisation.findMany({
        where,
        select: companySelect(criteria.today),
        ...page,
      }),
    ]);
    return { content, totalElements };
  }

  /** How many companies are in each status (the list's tabs). */
  async countByStatus(): Promise<Map<string, number>> {
    const groups = await this.txHost.tx.organisation.groupBy({
      by: ['status'],
      where: { isPlatform: false },
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
    return new Map(groups.map((group) => [group.status, group._count._all]));
  }

  findById(id: string, today: Date): Promise<CompanyRecord | null> {
    return this.txHost.tx.organisation.findFirst({
      where: { id, isPlatform: false },
      select: companySelect(today),
    });
  }

  async findUserPage(
    organisationId: string,
    criteria: { people: CompanyPeople | null; searchTerms: string[] },
    pageable: Pageable<CompanyUserSortField>,
  ): Promise<{ content: CompanyUserRecord[]; totalElements: number }> {
    const where: Prisma.UserWhereInput = {
      organisationId,
      ...peopleWhere(criteria.people),
      AND: criteria.searchTerms.map((term) => ({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' as const } },
          { lastName: { contains: term, mode: 'insensitive' as const } },
          { email: { contains: term, mode: 'insensitive' as const } },
        ],
      })),
    };
    const page = toPrismaPage(pageable, userOrderBy, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.user.count({ where }),
      this.txHost.tx.user.findMany({ where, select: companyUserSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  /**
   * Moves a company from one of `from` to `to` (approve / reject); false → it was in another
   * status meanwhile.
   */
  async decide(
    id: string,
    from: readonly string[],
    decision: { status: string; rejectionReason: string | null; decidedBy: string },
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.organisation.updateMany({
      where: { id, isPlatform: false, status: { in: [...from] } },
      data: {
        status: decision.status,
        rejectionReason: decision.rejectionReason,
        decidedBy: decision.decidedBy,
        decidedAt: new Date(),
        updatedBy: decision.decidedBy,
        version: { increment: 1 },
      },
    });
    return count > 0;
  }
}
