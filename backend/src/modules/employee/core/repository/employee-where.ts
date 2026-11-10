import type { Prisma } from '../../../../generated/prisma/client';
import { EmployeeStatus } from '../service/employee-status';
import type { EmployeeCriteria } from '../service/filter/employee.criteria';

export const activeOn = (today: Date): Prisma.EmployeeWhereInput => ({
  OR: [{ terminatedOn: null }, { terminatedOn: { gt: today } }],
});

/** Each term must match first name, last name or email. */
export const searchWhere = (terms: string[]): Prisma.EmployeeWhereInput[] =>
  terms.map((term) => ({
    user: {
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    },
  }));

/** Employed on at least one day of [from, to] (`terminated_on` is the first day without work). */
export const employedBetween = (from: Date, to: Date): Prisma.EmployeeWhereInput => ({
  startDate: { lte: to },
  OR: [{ terminatedOn: null }, { terminatedOn: { gt: from } }],
});

/** Scoped to the organisation; filters are applied in the query, never after. */
export const employeeWhere = (
  organisationId: string,
  criteria: Omit<EmployeeCriteria, 'categoryId'> & { categoryId?: string | undefined },
): Prisma.EmployeeWhereInput => ({
  organisationId,
  AND: [
    criteria.status === EmployeeStatus.ACTIVE
      ? activeOn(criteria.today)
      : { terminatedOn: { lte: criteria.today } },
    ...searchWhere(criteria.searchTerms),
    ...(criteria.categoryId ? [{ position: { categoryId: criteria.categoryId } }] : []),
    ...(criteria.positionId ? [{ positionId: criteria.positionId }] : []),
  ],
});
