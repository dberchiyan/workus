import type { Prisma } from '../../../../generated/prisma/client';

export const MAX_REQUEST_RESPONSIBLES = 10;
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
    startsAt: true,
    endsAt: true,
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

export const requestStateSelect = {
    id: true,
    employeeId: true,
    status: true,
    type: true,
    startsAt: true,
    endsAt: true,
} satisfies Prisma.TimeOffRequestSelect;
export type RequestStateRecord = Prisma.TimeOffRequestGetPayload<{
    select: typeof requestStateSelect;
}>;

export const heldDaysSelect = {
    type: true,
    status: true,
    startsAt: true,
    days: true,
} satisfies Prisma.TimeOffRequestSelect;
export type HeldDaysRecord = Prisma.TimeOffRequestGetPayload<{ select: typeof heldDaysSelect }>;

export const absenceSelect = {
    employeeId: true,
    startsAt: true,
    endsAt: true,
    employee: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
} satisfies Prisma.TimeOffRequestSelect;
export type AbsenceRecord = Prisma.TimeOffRequestGetPayload<{ select: typeof absenceSelect }>;

export const calendarRequestSelect = {
    id: true,
    employeeId: true,
    type: true,
    status: true,
    startsAt: true,
    endsAt: true,
    days: true,
} satisfies Prisma.TimeOffRequestSelect;
export type CalendarRequestRecord = Prisma.TimeOffRequestGetPayload<{
    select: typeof calendarRequestSelect;
}>;

export const dashboardRequestSelect = {
    id: true,
    type: true,
    status: true,
    startsAt: true,
    endsAt: true,
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

export const absenceDaysSelect = {
    employeeId: true,
    type: true,
    startsAt: true,
    endsAt: true,
} satisfies Prisma.TimeOffRequestSelect;
export type AbsenceDaysRecord = Prisma.TimeOffRequestGetPayload<{
    select: typeof absenceDaysSelect;
}>;

export const requestNoticeSelect = {
    id: true,
    organisationId: true,
    type: true,
    startsAt: true,
    endsAt: true,
    createdAt: true,
    employee: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
    responsibles: { select: { responsibleUserId: true }, take: MAX_REQUEST_RESPONSIBLES },
} satisfies Prisma.TimeOffRequestSelect;
export type RequestNoticeRecord = Prisma.TimeOffRequestGetPayload<{
    select: typeof requestNoticeSelect;
}>;
