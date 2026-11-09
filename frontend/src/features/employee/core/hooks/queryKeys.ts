import type { SecurityCategory } from '@/features/auth';
import type { EmployeeFilters, EmployeeListParams } from '../types';

/** No tenant id: the organisation comes from the session (see auth queryKeys). */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  summary: () => [...employeeKeys.all, 'summary'] as const,
  detail: (employeeId: string) => [...employeeKeys.all, 'detail', employeeId] as const,
  activity: (employeeId: string) => [...employeeKeys.detail(employeeId), 'activity'] as const,
  activityPage: (employeeId: string, page: number) =>
    [...employeeKeys.activity(employeeId), page] as const,
  securityLog: (employeeId: string, category: SecurityCategory | undefined, page: number) =>
    [...employeeKeys.detail(employeeId), 'security-log', category ?? 'ALL', page] as const,
  categories: (filters: EmployeeFilters) => [...employeeKeys.all, 'categories', filters] as const,
  positions: () => [...employeeKeys.all, 'positions'] as const,
  responsibleCandidates: (search: string) =>
    [...employeeKeys.all, 'responsible-candidates', search] as const,
};
