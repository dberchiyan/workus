import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { todayUtcRange } from '@/shared/lib/utcDay';
import { timeOffApi } from '../api/timeOffApi';
import type { CreateTimeOffRequest, TimeOffRequest } from '../types';
import { timeOffKeys } from './queryKeys';

export const REQUESTS_PAGE_SIZE = 20;

export const useOwnBalances = () =>
  useQuery({ queryKey: timeOffKeys.ownBalances(), queryFn: timeOffApi.ownBalances });

export const useEmployeeBalances = (employeeId: string) =>
  useQuery({
    queryKey: timeOffKeys.employeeBalances(employeeId),
    queryFn: () => timeOffApi.employeeBalances(employeeId),
  });

/** The start of today (UTC, as everywhere), as an instant. */
const startOfToday = (): string => todayUtcRange().from;

/**
 * Dashboard: pending requests and any changed today (any status), newest first, a page at a
 * time. The day boundary is in the key, so a new day refetches.
 */
export const useOwnRequests = () => {
  const changedSince = startOfToday();
  return useInfiniteQuery({
    queryKey: timeOffKeys.ownRequestsSince(changedSince),
    queryFn: ({ pageParam }) => timeOffApi.ownRequests(pageParam, REQUESTS_PAGE_SIZE, changedSince),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements
        ? pages.length
        : undefined,
  });
};

/** Not optimistic; balances and requests are refetched. */
const useOwnTimeOffMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<TimeOffRequest>,
) => {
  const queryClient = useQueryClient();
  return useMutation<TimeOffRequest, ApiError, TVariables>({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: timeOffKeys.ownBalances() }),
        queryClient.invalidateQueries({ queryKey: timeOffKeys.ownRequests() }),
      ]);
    },
  });
};

export const useCreateTimeOffRequest = () =>
  useOwnTimeOffMutation(
    ({ request, idempotencyKey }: { request: CreateTimeOffRequest; idempotencyKey: string }) =>
      timeOffApi.create(request, idempotencyKey),
  );

export const useCancelTimeOffRequest = () =>
  useOwnTimeOffMutation((requestId: string) => timeOffApi.cancel(requestId));
