import type { Prisma } from '../../../../generated/prisma/client';

export const MAX_REQUEST_RESPONSIBLES = 10;
/** The newest comments of a request; a thread longer than this shows its latest part. */
export const MAX_REQUEST_COMMENTS = 50;

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
  comments: {
    select: {
      id: true,
      body: true,
      createdAt: true,
      editedAt: true,
      author: { select: personSelect },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: MAX_REQUEST_COMMENTS,
  },
  _count: { select: { comments: true } },
} satisfies Prisma.TimeOffRequestSelect;
export type TimeOffRequestRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof timeOffRequestSelect;
}>;

/** A request with whose it is (admin lists). */
export const managedTimeOffRequestSelect = {
  ...timeOffRequestSelect,
  employeeId: true,
  employee: {
    select: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      position: { select: { title: true } },
    },
  },
} satisfies Prisma.TimeOffRequestSelect;
export type ManagedTimeOffRequestRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof managedTimeOffRequestSelect;
}>;

export const timeOffCommentSelect = timeOffRequestSelect.comments.select;
export type TimeOffCommentRecord = Prisma.TimeOffRequestCommentGetPayload<{
  select: typeof timeOffCommentSelect;
}>;

/** What a status change checks and records (one row, no relations). */
export const requestStateSelect = {
  id: true,
  employeeId: true,
  status: true,
  type: true,
  startDate: true,
  endDate: true,
} satisfies Prisma.TimeOffRequestSelect;
export type RequestStateRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof requestStateSelect;
}>;

/** What balances are summed from. */
export const heldDaysSelect = {
  type: true,
  status: true,
  startDate: true,
  days: true,
} satisfies Prisma.TimeOffRequestSelect;
export type HeldDaysRecord = Prisma.TimeOffRequestGetPayload<{ select: typeof heldDaysSelect }>;

/** Who is off and when (dashboard). */
export const absenceSelect = {
  employeeId: true,
  startDate: true,
  endDate: true,
  employee: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
} satisfies Prisma.TimeOffRequestSelect;
export type AbsenceRecord = Prisma.TimeOffRequestGetPayload<{ select: typeof absenceSelect }>;

/** A request as the calendar draws it. */
export const calendarRequestSelect = {
  id: true,
  employeeId: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  days: true,
} satisfies Prisma.TimeOffRequestSelect;
export type CalendarRequestRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof calendarRequestSelect;
}>;

/** A request on the admin dashboard: whose, what and its state. */
export const dashboardRequestSelect = {
  id: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  days: true,
  createdAt: true,
  employee: {
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true } },
      position: { select: { title: true } },
    },
  },
} satisfies Prisma.TimeOffRequestSelect;
export type DashboardRequestRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof dashboardRequestSelect;
}>;

/** An approved request as the insights count it. */
export const absenceDaysSelect = {
  employeeId: true,
  type: true,
  startDate: true,
  endDate: true,
} satisfies Prisma.TimeOffRequestSelect;
export type AbsenceDaysRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof absenceDaysSelect;
}>;

/** What a notification about a request needs: its summary, whose it is, who decides it. */
export const requestNoticeSelect = {
  id: true,
  organisationId: true,
  type: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  employee: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
  responsibles: { select: { responsibleUserId: true }, take: MAX_REQUEST_RESPONSIBLES },
} satisfies Prisma.TimeOffRequestSelect;
export type RequestNoticeRecord = Prisma.TimeOffRequestGetPayload<{
  select: typeof requestNoticeSelect;
}>;
