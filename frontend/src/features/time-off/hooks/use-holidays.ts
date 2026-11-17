import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import { MINUTE_MS } from '@/shared/lib/units';

import { holidaysApi } from '../api/holidays-api';
import type { CreateHolidayRequest, Holiday, UpdateHolidayRequest } from '../types';
import { timeOffKeys } from './query-keys';

const HOLIDAYS_STALE_MINUTES = 5;
const HOLIDAYS_STALE_MS = HOLIDAYS_STALE_MINUTES * MINUTE_MS;

export const useHolidays = (
    year: number,
): UseQueryResult<
    { id: string; heldAt: string; name: string; isRecurring: boolean; isCarriedOver: boolean; version: number }[]
> =>
    useQuery({
        queryKey: timeOffKeys.holidayYear(year),
        queryFn: () => holidaysApi.year(year),
        staleTime: HOLIDAYS_STALE_MS,
    });

/** Holidays of these years by heldAt (`YYYY-MM-DD` → name); empty while loading. */
export const useHolidayNames = (years: readonly number[]): ReadonlyMap<string, string> => {
    const results = useQueries({
        queries: [...new Set(years)].map((year) => ({
            queryKey: timeOffKeys.holidayYear(year),
            queryFn: () => holidaysApi.year(year),
            staleTime: HOLIDAYS_STALE_MS,
        })),
    });
    return new Map(results.flatMap((result) => (result.data ?? []).map((holiday) => [holiday.heldAt, holiday.name])));
};

/**
 * A holiday change also changes the working days of requests that cover it (balances, lists,
 * the calendar), so everything time off is refetched. Never optimistic.
 */
const useHolidayMutation = <TResult, TVariables>(mutationFn: (variables: TVariables) => Promise<TResult>) => {
    const queryClient = useQueryClient();
    return useMutation<TResult, ApiError, TVariables>({
        mutationFn,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
        },
    });
};

export const useCreateHoliday = (): UseMutationResult<
    { id: string; heldAt: string; name: string; isRecurring: boolean; isCarriedOver: boolean; version: number },
    ApiError,
    { request: CreateHolidayRequest; idempotencyKey: string }
> =>
    useHolidayMutation<Holiday, { request: CreateHolidayRequest; idempotencyKey: string }>(
        ({ request, idempotencyKey }) => holidaysApi.create(request, idempotencyKey),
    );

export const useUpdateHoliday = (): UseMutationResult<
    { id: string; heldAt: string; name: string; isRecurring: boolean; isCarriedOver: boolean; version: number },
    ApiError,
    { holidayId: string; request: UpdateHolidayRequest }
> =>
    useHolidayMutation<Holiday, { holidayId: string; request: UpdateHolidayRequest }>(({ holidayId, request }) =>
        holidaysApi.update(holidayId, request),
    );

export const useDeleteHoliday = (): UseMutationResult<void, ApiError, string> =>
    useHolidayMutation((holidayId: string) => holidaysApi.remove(holidayId));
