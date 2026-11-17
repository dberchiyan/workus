import type { Prisma } from '../../../../../generated/prisma/client';

export const MAX_REVIEWS = 200;
export const MAX_REVIEW_RESPONSIBLES = 10;

export const reviewSelect = {
    id: true,
    kind: true,
    title: true,
    reviewedAt: true,
    status: true,
    salaryAmount: true,
    salaryCurrency: true,
    feedbackHr: true,
    feedbackLead: true,
    feedbackTeam: true,
    feedbackClient: true,
    createdAt: true,
    version: true,
    responsibles: {
        select: { responsible: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: [{ responsible: { firstName: 'asc' } }, { responsible: { lastName: 'asc' } }],
        take: MAX_REVIEW_RESPONSIBLES,
    },
} satisfies Prisma.EmployeeReviewSelect;
export type ReviewRecord = Prisma.EmployeeReviewGetPayload<{ select: typeof reviewSelect }>;

export const dashboardReviewSelect = {
    id: true,
    title: true,
    reviewedAt: true,
    status: true,
    employee: {
        select: {
            id: true,
            user: { select: { id: true, firstName: true, lastName: true } },
            position: { select: { title: true } },
        },
    },
} satisfies Prisma.EmployeeReviewSelect;
export type DashboardReviewRecord = Prisma.EmployeeReviewGetPayload<{
    select: typeof dashboardReviewSelect;
}>;
