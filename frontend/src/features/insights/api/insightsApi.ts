import { apiClient } from '@/shared/api/client';
import type {
  Absence,
  CategoryCounts,
  Headcount,
  InsightsFilter,
  Salary,
  Tenure,
  Turnover,
} from '../types';

const BASE = '/api/v1/insights';

const get = async <T>(path: string, filter: InsightsFilter): Promise<T> =>
  (
    await apiClient.get<T>(`${BASE}/${path}`, {
      params: {
        year: filter.year,
        ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      },
    })
  ).data;

/** Company figures for one year (admin). */
export const insightsApi = {
  headcount: (filter: InsightsFilter) => get<Headcount>('headcount', filter),
  tenure: (filter: InsightsFilter) => get<Tenure>('tenure', filter),
  turnover: (filter: InsightsFilter) => get<Turnover>('turnover', filter),
  absence: (filter: InsightsFilter) => get<Absence>('absence', filter),
  salary: (filter: InsightsFilter) => get<Salary>('salary', filter),
  /** Position categories for the filter (with today's active counts). */
  categories: async (): Promise<CategoryCounts> =>
    (
      await apiClient.get<CategoryCounts>('/api/v1/position-categories', {
        params: { status: 'ACTIVE' },
      })
    ).data,
};
