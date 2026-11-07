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
  /** Requests made in the viewer's day (first 100). */
  requests: async (day: LocalDay): Promise<DashboardRequests> =>
    (
      await apiClient.get<DashboardRequests>(`${BASE}/requests`, {
        params: { from: day.from, to: day.to },
      })
    ).data,
  reviews: async (range: DateRange, page: number): Promise<DashboardReviews> =>
    (await apiClient.get<DashboardReviews>(`${BASE}/reviews`, { params: paged(range, page) })).data,
  birthdays: async (range: DateRange, page: number): Promise<DashboardBirthdays> =>
    (await apiClient.get<DashboardBirthdays>(`${BASE}/birthdays`, { params: paged(range, page) }))
      .data,
};
