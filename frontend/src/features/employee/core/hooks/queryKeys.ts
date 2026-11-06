import type { EmployeeFilters, EmployeeListParams } from '../types';

/** No tenant: one company per installation, roles are global. */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  summary: () => [...employeeKeys.all, 'summary'] as const,
  detail: (employeeId: string) => [...employeeKeys.all, 'detail', employeeId] as const,
  activity: (employeeId: string) => [...employeeKeys.detail(employeeId), 'activity'] as const,
  categories: (filters: EmployeeFilters) => [...employeeKeys.all, 'categories', filters] as const,
  positions: () => [...employeeKeys.all, 'positions'] as const,
  responsibleCandidates: (search: string) =>
    [...employeeKeys.all, 'responsible-candidates', search] as const,
};
