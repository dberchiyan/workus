import type { Prisma } from '../../../../generated/prisma/client';

/** Owners shown with a company (a handful at most). */
export const MAX_OWNERS_SHOWN = 3;

const ownersSelect = {
  where: { role: 'OWNER' },
  select: { id: true, firstName: true, lastName: true, email: true },
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  take: MAX_OWNERS_SHOWN,
} satisfies Prisma.Organisation$usersArgs;

/** A company as the platform's list shows it: who owns it and how big it is — no HR data. */
export const companySelect = (today: Date) =>
  ({
    id: true,
    name: true,
    status: true,
    createdAt: true,
    decidedAt: true,
    rejectionReason: true,
    version: true,
    decider: { select: { firstName: true, lastName: true } },
    users: ownersSelect,
    _count: {
      select: {
        users: { where: { role: 'ADMIN' } },
        employees: { where: { OR: [{ terminatedOn: null }, { terminatedOn: { gt: today } }] } },
      },
    },
  }) satisfies Prisma.OrganisationSelect;
export type CompanyRecord = Prisma.OrganisationGetPayload<{
  select: ReturnType<typeof companySelect>;
}>;

/** A person of a company, directory facts only (never salaries, reviews, time off, contacts). */
export const companyUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
  employee: { select: { terminatedOn: true } },
} satisfies Prisma.UserSelect;
export type CompanyUserRecord = Prisma.UserGetPayload<{ select: typeof companyUserSelect }>;
