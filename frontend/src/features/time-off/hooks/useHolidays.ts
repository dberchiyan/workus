import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { holidaysApi } from '../api/holidaysApi';
import type { CreateHolidayRequest, Holiday, UpdateHolidayRequest } from '../types';
import { timeOffKeys } from './queryKeys';

/** Holidays change rarely. */
const HOLIDAYS_STALE_MS = 5 * 60_000;

export const useHolidays = (year: number) =>
  useQuery({
    queryKey: timeOffKeys.holidayYear(year),
    queryFn: () => holidaysApi.year(year),
    staleTime: HOLIDAYS_STALE_MS,
  });

/** Holidays of these years by date (`YYYY-MM-DD` → name); empty while loading. */
export const useHolidayNames = (years: readonly number[]): ReadonlyMap<string, string> => {
  const results = useQueries({
    queries: [...new Set(years)].map((year) => ({
      queryKey: timeOffKeys.holidayYear(year),
      queryFn: () => holidaysApi.year(year),
      staleTime: HOLIDAYS_STALE_MS,
    })),
  });
  return new Map(
    results.flatMap((result) => (result.data ?? []).map((holiday) => [holiday.date, holiday.name])),
  );
};

/**
 * A holiday change also changes the working days of requests that cover it (balances, lists,
 * the calendar), so everything time off is refetched. Never optimistic.
 */
const useHolidayMutation = <TResult, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVariables>({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
    },
  });
};

export const useCreateHoliday = () =>
  useHolidayMutation<Holiday, { request: CreateHolidayRequest; idempotencyKey: string }>(
    ({ request, idempotencyKey }) => holidaysApi.create(request, idempotencyKey),
  );

export const useUpdateHoliday = () =>
  useHolidayMutation<Holiday, { holidayId: string; request: UpdateHolidayRequest }>(
    ({ holidayId, request }) => holidaysApi.update(holidayId, request),
  );

export const useDeleteHoliday = () =>
  useHolidayMutation((holidayId: string) => holidaysApi.remove(holidayId));
