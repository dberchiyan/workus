import { apiClient } from '@/shared/api/client';
import {
  type AdminDashboard,
  type DashboardBirthdays,
  type DashboardRequests,
  type DashboardReviews,
  type DateRange,
  EVENTS_PAGE_SIZE,
  type LocalDay,
} from '../types';

const BASE = '/api/v1/dashboard/admin';

const paged = (range: DateRange, page: number) => ({ ...range, page, size: EVENTS_PAGE_SIZE });

export const dashboardApi = {
  admin: async (): Promise<AdminDashboard> => (await apiClient.get<AdminDashboard>(BASE)).data,
  /** Requests made today (UTC), newest first, five a page. */
  requests: async (day: LocalDay, page: number): Promise<DashboardRequests> =>
    (
      await apiClient.get<DashboardRequests>(`${BASE}/requests`, {
        params: { from: day.from, to: day.to, page, size: EVENTS_PAGE_SIZE },
      })
    ).data,
  reviews: async (range: DateRange, page: number): Promise<DashboardReviews> =>
    (await apiClient.get<DashboardReviews>(`${BASE}/reviews`, { params: paged(range, page) })).data,
  birthdays: async (range: DateRange, page: number): Promise<DashboardBirthdays> =>
    (await apiClient.get<DashboardBirthdays>(`${BASE}/birthdays`, { params: paged(range, page) }))
      .data,
};
