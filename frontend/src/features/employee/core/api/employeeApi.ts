import { apiClient } from '@/shared/api/client';
import type {
  ActivityPage,
  CategoryCounts,
  CreatedEmployee,
  CreateEmployeeRequest,
  EmployeeFilters,
  EmployeeListParams,
  EmployeePage,
  EmployeeProfile,
  EmployeeSummary,
  PositionOption,
  TerminateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateResponsiblesRequest,
  ResponsibleCandidate,
} from '../types';

const filterParams = ({ status, search }: EmployeeFilters) => ({
  status,
  ...(search ? { search } : {}),
});

export const employeeApi = {
  list: async (params: EmployeeListParams): Promise<EmployeePage> =>
    (
      await apiClient.get<EmployeePage>('/api/v1/employees', {
        params: {
          ...filterParams(params),
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
          page: params.page - 1,
          size: params.size,
          sort: `${params.sortField},${params.sortDirection}`,
        },
      })
    ).data,
  profile: async (employeeId: string): Promise<EmployeeProfile> =>
    (await apiClient.get<EmployeeProfile>(`/api/v1/employees/${encodeURIComponent(employeeId)}`))
      .data,
  /** Newest first; `page` is 0-based. */
  activity: async (employeeId: string, page: number, size: number): Promise<ActivityPage> =>
    (
      await apiClient.get<ActivityPage>(
        `/api/v1/employees/${encodeURIComponent(employeeId)}/activity`,
        { params: { page, size, sort: 'occurredAt,desc' } },
      )
    ).data,
  summary: async (): Promise<EmployeeSummary> =>
    (await apiClient.get<EmployeeSummary>('/api/v1/employees/summary')).data,
  categories: async (filters: EmployeeFilters): Promise<CategoryCounts> =>
    (
      await apiClient.get<CategoryCounts>('/api/v1/position-categories', {
        params: filterParams(filters),
      })
    ).data,
  /** The key identifies one logical "create" — reused on retry so it never creates twice. */
  create: async (
    request: CreateEmployeeRequest,
    idempotencyKey: string,
  ): Promise<CreatedEmployee> =>
    (
      await apiClient.post<CreatedEmployee>('/api/v1/employees', request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  /** Replaces the responsible people; `version` is the one read (stale → 409). */
  updateResponsibles: async (
    employeeId: string,
    request: UpdateResponsiblesRequest,
  ): Promise<EmployeeProfile> =>
    (await apiClient.put<EmployeeProfile>(`/api/v1/employees/${employeeId}/responsibles`, request))
      .data,
  /** Name, work email, position, start date, contacts; `version` is the one read. */
  update: async (employeeId: string, request: UpdateEmployeeRequest): Promise<void> => {
    await apiClient.put(`/api/v1/employees/${employeeId}`, request);
  },
  /** Terminate from a date, or change the termination. */
  terminate: async (employeeId: string, request: TerminateEmployeeRequest): Promise<void> => {
    await apiClient.put(`/api/v1/employees/${employeeId}/termination`, request);
  },
  cancelTermination: async (employeeId: string, version: number): Promise<void> => {
    await apiClient.delete(`/api/v1/employees/${employeeId}/termination`, { data: { version } });
  },
  positions: async (): Promise<PositionOption[]> =>
    (await apiClient.get<{ content: PositionOption[] }>('/api/v1/positions')).data.content,
  responsibleCandidates: async (search: string): Promise<ResponsibleCandidate[]> =>
    (
      await apiClient.get<{ content: ResponsibleCandidate[] }>('/api/v1/responsible-candidates', {
        params: search ? { search } : {},
      })
    ).data.content,
};
