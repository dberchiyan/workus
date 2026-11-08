import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { DateRange, LocalDay } from '../types';

/** No tenant id: the organisation comes from the session (see auth queryKeys). */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  requests: (day: LocalDay, page: number) =>
    [...dashboardKeys.admin(), 'requests', day, page] as const,
  reviews: (range: DateRange, page: number) =>
    [...dashboardKeys.admin(), 'reviews', range, page] as const,
  birthdays: (range: DateRange, page: number) =>
    [...dashboardKeys.admin(), 'birthdays', range, page] as const,
};

export const useAdminDashboard = () =>
  useQuery({ queryKey: dashboardKeys.admin(), queryFn: dashboardApi.admin });

/** Another page keeps the previous rows on screen until the new ones arrive. */
export const useTodayRequests = (day: LocalDay, page: number) =>
  useQuery({
    queryKey: dashboardKeys.requests(day, page),
    queryFn: () => dashboardApi.requests(day, page),
    placeholderData: keepPreviousData,
  });

/** Another page or month keeps the previous rows on screen until the new ones arrive. */
export const useEventReviews = (range: DateRange, page: number) =>
  useQuery({
    queryKey: dashboardKeys.reviews(range, page),
    queryFn: () => dashboardApi.reviews(range, page),
    placeholderData: keepPreviousData,
  });

export const useEventBirthdays = (range: DateRange, page: number) =>
  useQuery({
    queryKey: dashboardKeys.birthdays(range, page),
    queryFn: () => dashboardApi.birthdays(range, page),
    placeholderData: keepPreviousData,
  });
