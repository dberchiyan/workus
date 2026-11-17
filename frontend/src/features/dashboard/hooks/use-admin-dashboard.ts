import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { components } from '@/shared/types/api';

import { dashboardApi } from '../api/dashboard-api';
import type { DateRange, LocalDay } from '../types';

/** No tenant id: the organisation comes from the session (see auth queryKeys). */
export const dashboardKeys = {
    all: ['dashboard'] as const,
    admin: (): readonly ['dashboard', 'admin'] => [...dashboardKeys.all, 'admin'] as const,
    requests: (day: LocalDay, page: number): readonly ['dashboard', 'admin', 'requests', LocalDay, number] =>
        [...dashboardKeys.admin(), 'requests', day, page] as const,
    reviews: (range: DateRange, page: number): readonly ['dashboard', 'admin', 'reviews', DateRange, number] =>
        [...dashboardKeys.admin(), 'reviews', range, page] as const,
    birthdays: (range: DateRange, page: number): readonly ['dashboard', 'admin', 'birthdays', DateRange, number] =>
        [...dashboardKeys.admin(), 'birthdays', range, page] as const,
};

export const useAdminDashboard = (): UseQueryResult<{
    today: string;
    pendingRequests: { count: number; oldestCreatedAt: string | null };
    outToday: { count: number; people: { id: string; firstName: string; lastName: string }[]; laterThisWeek: number };
    reviewsDue: { upcoming: number; overdue: number };
    movements: {
        joining: number;
        leaving: number;
        next: {
            kind: 'JOINING' | 'LEAVING';
            movedAt: string;
            employeeId: string;
            person: { id: string; firstName: string; lastName: string };
        } | null;
    };
}> => useQuery({ queryKey: dashboardKeys.admin(), queryFn: dashboardApi.admin });

/** Another page keeps the previous rows on screen until the new ones arrive. */
export const useTodayRequests = (
    day: LocalDay,
    page: number,
): UseQueryResult<{ content: components['schemas']['DashboardRequest_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: dashboardKeys.requests(day, page),
        queryFn: () => dashboardApi.requests(day, page),
        placeholderData: keepPreviousData,
    });

/** Another page or month keeps the previous rows on screen until the new ones arrive. */
export const useEventReviews = (
    range: DateRange,
    page: number,
): UseQueryResult<{ content: components['schemas']['DashboardReview_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: dashboardKeys.reviews(range, page),
        queryFn: () => dashboardApi.reviews(range, page),
        placeholderData: keepPreviousData,
    });

export const useEventBirthdays = (
    range: DateRange,
    page: number,
): UseQueryResult<{ content: components['schemas']['DashboardBirthday_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: dashboardKeys.birthdays(range, page),
        queryFn: () => dashboardApi.birthdays(range, page),
        placeholderData: keepPreviousData,
    });
