import type { Prisma } from '../../../../generated/prisma/client';
import { EmployeeStatus } from '../service/employee-status';
import type { EmployeeCriteria } from '../service/filter/employee.criteria';

export const activeOn = (today: Date): Prisma.EmployeeWhereInput => ({
  OR: [{ terminatedOn: null }, { terminatedOn: { gt: today } }],
});

/** Tenant-free (one company per installation); filters are applied in the query, never after. */
export const employeeWhere = (
  criteria: Omit<EmployeeCriteria, 'categoryId'> & { categoryId?: string | undefined },
): Prisma.EmployeeWhereInput => ({
  AND: [
    criteria.status === EmployeeStatus.ACTIVE
      ? activeOn(criteria.today)
      : { terminatedOn: { lte: criteria.today } },
    ...criteria.searchTerms.map((term): Prisma.EmployeeWhereInput => ({
      user: {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
    })),
    ...(criteria.categoryId ? [{ position: { categoryId: criteria.categoryId } }] : []),
  ],
});
