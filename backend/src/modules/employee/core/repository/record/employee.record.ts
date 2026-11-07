import type { Prisma } from '../../../../../generated/prisma/client';

/** Shown per row; the rest is summarised by `_count`. */
export const RESPONSIBLES_PER_ROW = 3;

export const employeeListItemSelect = {
  id: true,
  startDate: true,
  terminatedOn: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  position: { select: { id: true, title: true, category: { select: { id: true, name: true } } } },
  responsibles: {
    select: { responsible: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ responsible: { firstName: 'asc' } }, { responsible: { lastName: 'asc' } }],
    take: RESPONSIBLES_PER_ROW,
  },
  _count: { select: { responsibles: true } },
} satisfies Prisma.EmployeeSelect;
export type EmployeeListItemRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeListItemSelect;
}>;

export const positionOptionSelect = {
  id: true,
  title: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.PositionSelect;
export type PositionOptionRecord = Prisma.PositionGetPayload<{
  select: typeof positionOptionSelect;
}>;

export const responsibleCandidateSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  employee: { select: { position: { select: { title: true } } } },
} satisfies Prisma.UserSelect;
export type ResponsibleCandidateRecord = Prisma.UserGetPayload<{
  select: typeof responsibleCandidateSelect;
}>;

/** Bounded: a profile shows everyone responsible, but never an unbounded list. */
export const PROFILE_RESPONSIBLES_LIMIT = 20;

export const employeeProfileSelect = {
  id: true,
  startDate: true,
  terminatedOn: true,
  terminationReason: true,
  terminationComment: true,
  mobile: true,
  personalEmail: true,
  linkedinUrl: true,
  telegram: true,
  address: true,
  dateOfBirth: true,
  createdAt: true,
  version: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
  position: { select: { id: true, title: true, category: { select: { id: true, name: true } } } },
  responsibles: {
    select: {
      responsible: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          employee: { select: { position: { select: { title: true } } } },
        },
      },
    },
    orderBy: [{ responsible: { firstName: 'asc' } }, { responsible: { lastName: 'asc' } }],
    take: PROFILE_RESPONSIBLES_LIMIT,
  },
} satisfies Prisma.EmployeeSelect;
export type EmployeeProfileRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeProfileSelect;
}>;

/** What other modules need to plan time off: dates and who decides. */
export const employeeTimeOffSelect = {
  id: true,
  startDate: true,
  terminatedOn: true,
  responsibles: { select: { responsibleUserId: true }, take: 10 },
} satisfies Prisma.EmployeeSelect;
export type EmployeeTimeOffRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeTimeOffSelect;
}>;

/** One row of the time-off calendar. */
export const employeeCalendarSelect = {
  id: true,
  startDate: true,
  terminatedOn: true,
  user: { select: { id: true, firstName: true, lastName: true } },
  position: { select: { title: true } },
} satisfies Prisma.EmployeeSelect;
export type EmployeeCalendarRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeCalendarSelect;
}>;

/** Who starts or leaves, and when (dashboard). */
export const employeeMovementSelect = {
  id: true,
  startDate: true,
  terminatedOn: true,
  user: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.EmployeeSelect;
export type EmployeeMovementRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeMovementSelect;
}>;
