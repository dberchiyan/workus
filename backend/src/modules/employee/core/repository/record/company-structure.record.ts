import type { Prisma } from '../../../../../generated/prisma/client';

export const structurePositionSelect = {
  id: true,
  title: true,
  version: true,
} satisfies Prisma.PositionSelect;
export type StructurePositionRecord = Prisma.PositionGetPayload<{
  select: typeof structurePositionSelect;
}>;

/** A department with its positions (bounded: a company has at most MAX_POSITIONS). */
export const departmentSelect = {
  id: true,
  name: true,
  version: true,
  positions: { select: structurePositionSelect, orderBy: { title: 'asc' }, take: 200 },
} satisfies Prisma.PositionCategorySelect;
export type DepartmentRecord = Prisma.PositionCategoryGetPayload<{
  select: typeof departmentSelect;
}>;
