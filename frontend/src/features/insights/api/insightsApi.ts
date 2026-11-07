import { apiClient } from '@/shared/api/client';
import type { CategoryCounts, Insights, InsightsFilter } from '../types';

/** Company figures for one year (admin). */
export const insightsApi = {
  /** Every figure in one request (the server reads the roster once). */
  get: async (filter: InsightsFilter): Promise<Insights> =>
    (
      await apiClient.get<Insights>('/api/v1/insights', {
        params: {
          year: filter.year,
          ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
        },
      })
    ).data,
  /** Position categories for the filter (with today's active counts). */
  categories: async (): Promise<CategoryCounts> =>
    (
      await apiClient.get<CategoryCounts>('/api/v1/position-categories', {
        params: { status: 'ACTIVE' },
      })
    ).data,
};
