import type { Prisma } from '../../../../generated/prisma/client';

export const MAX_REQUEST_RESPONSIBLES = 10;

const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  employee: { select: { position: { select: { title: true } } } },
} satisfies Prisma.UserSelect;

export const timeOffRequestSelect = {
  id: true,
  type: true,
  startDate: true,
  endDate: true,
  days: true,
  status: true,
  note: true,
  decisionComment: true,
  decidedAt: true,
  createdAt: true,
  decider: { select: personSelect },
  responsibles: {
    select: { responsible: { select: personSelect } },
    orderBy: [{ responsible: { firstName: 'asc' } }, { responsible: { lastName: 'asc' } }],
    take: MAX_REQUEST_RESPONSIBLES,
  },
} satisfies Prisma.TimeOffRequestSelect;
export type TimeOffRequestRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof timeOffRequestSelect;
}>;

/** What balances are summed from. */
export const heldDaysSelect = {
  type: true,
  status: true,
  startDate: true,
  days: true,
} satisfies Prisma.TimeOffRequestSelect;
export type HeldDaysRecord = Prisma.TimeOffRequestGetPayload<{ select: typeof heldDaysSelect }>;
