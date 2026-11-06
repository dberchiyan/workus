import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { employeeApi } from '../api/employeeApi';
import type {
  CreatedEmployee,
  CreateEmployeeRequest,
  EmployeeFilters,
  EmployeeListParams,
  EmployeeProfile,
  TerminateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateResponsiblesRequest,
} from '../types';
import { employeeReviewsKey } from '@/features/employee/review';
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

/** Not optimistic; on success the profile, its history, the list and the cards are refetched. */
export const useUpdateResponsibles = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation<EmployeeProfile, ApiError, UpdateResponsiblesRequest>({
    mutationFn: (request) => employeeApi.updateResponsibles(employeeId, request),
    onSuccess: async (profile) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), profile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.activity(employeeId) }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
      ]);
    },
  });
};

/**
 * Profile edits, terminations and their cancellation change the profile, its history, the list,
 * the cards, the tab counts and — through the start date or canceled reviews — the reviews.
 * Not optimistic.
 */
const useEmploymentMutation = <TVariables>(
  employeeId: string,
  mutationFn: (variables: TVariables) => Promise<void>,
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, TVariables>({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'categories'] }),
        queryClient.invalidateQueries({
          queryKey: [...employeeKeys.all, 'responsible-candidates'],
        }),
        queryClient.invalidateQueries({ queryKey: employeeReviewsKey(employeeId) }),
      ]);
    },
  });
};

export const useUpdateEmployee = (employeeId: string) =>
  useEmploymentMutation(employeeId, (request: UpdateEmployeeRequest) =>
    employeeApi.update(employeeId, request),
  );

export const useTerminateEmployee = (employeeId: string) =>
  useEmploymentMutation(employeeId, (request: TerminateEmployeeRequest) =>
    employeeApi.terminate(employeeId, request),
  );

export const useCancelTermination = (employeeId: string) =>
  useEmploymentMutation(employeeId, (version: number) =>
    employeeApi.cancelTermination(employeeId, version),
  );

export const useEmployeeProfile = (employeeId: string) =>
  useQuery({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => employeeApi.profile(employeeId),
  });
