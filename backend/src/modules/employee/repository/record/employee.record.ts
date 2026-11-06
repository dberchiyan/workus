import type { Prisma } from '../../../../generated/prisma/client';

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
