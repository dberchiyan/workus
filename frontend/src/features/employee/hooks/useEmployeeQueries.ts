import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { employeeApi } from '../api/employeeApi';
import type {
  CreatedEmployee,
  CreateEmployeeRequest,
  EmployeeFilters,
  EmployeeListParams,
} from '../types';
import { employeeKeys } from './queryKeys';

export const useEmployees = (params: EmployeeListParams) =>
  useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useEmployeeSummary = () =>
  useQuery({ queryKey: employeeKeys.summary(), queryFn: employeeApi.summary });

export const usePositionCategories = (filters: EmployeeFilters) =>
  useQuery({
    queryKey: employeeKeys.categories(filters),
    queryFn: () => employeeApi.categories(filters),
    placeholderData: keepPreviousData,
  });

const POSITIONS_STALE_MS = 5 * 60_000;

export const usePositionOptions = (enabled: boolean) =>
  useQuery({
    queryKey: employeeKeys.positions(),
    queryFn: employeeApi.positions,
    staleTime: POSITIONS_STALE_MS,
    enabled,
  });

export const useResponsibleCandidates = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: employeeKeys.responsibleCandidates(search),
    queryFn: () => employeeApi.responsibleCandidates(search),
    placeholderData: keepPreviousData,
    enabled,
  });

/** Not optimistic; on success the list, cards and tab counts are refetched. */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation<
    CreatedEmployee,
    ApiError,
    { request: CreateEmployeeRequest; idempotencyKey: string }
  >({
    mutationFn: ({ request, idempotencyKey }) => employeeApi.create(request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'categories'] }),
        queryClient.invalidateQueries({
          queryKey: [...employeeKeys.all, 'responsible-candidates'],
        }),
      ]);
    },
  });
};
