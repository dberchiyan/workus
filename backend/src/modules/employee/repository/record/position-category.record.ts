import type { Prisma } from '../../../../generated/prisma/client';

export const positionCategorySelect = {
  id: true,
  name: true,
  positions: { select: { id: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.PositionCategorySelect;
export type PositionCategoryRecord = Prisma.PositionCategoryGetPayload<{
  select: typeof positionCategorySelect;
}>;
