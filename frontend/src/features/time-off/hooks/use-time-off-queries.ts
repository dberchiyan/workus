import type { InfiniteData } from '@tanstack/query-core';
import type { UseInfiniteQueryResult, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import { todayUtcRange } from '@/shared/lib/utc-day';
import type { components } from '@/shared/types/api';

import { timeOffApi } from '../api/time-off-api';
import type { CreateTimeOffRequest, TimeOffRequest } from '../types';
import { timeOffKeys } from './query-keys';

export const REQUESTS_PAGE_SIZE = 20;

export const useOwnBalances = (): UseQueryResult<{
    content: {
        type: components['schemas']['TimeOffType_Output'];
        cycleStartsAt: string;
        cycleEndsAt: string;
        allowance: number | null;
        used: number;
        pending: number;
        available: number | null;
    }[];
}> => useQuery({ queryKey: timeOffKeys.ownBalances(), queryFn: timeOffApi.ownBalances });

export const useEmployeeBalances = (
    employeeId: string,
): UseQueryResult<{
    content: {
        type: components['schemas']['TimeOffType_Output'];
        cycleStartsAt: string;
        cycleEndsAt: string;
        allowance: number | null;
        used: number;
        pending: number;
        available: number | null;
    }[];
}> =>
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
export const useOwnRequests = (): UseInfiniteQueryResult<
    InfiniteData<{ content: components['schemas']['TimeOffRequest_Output'][]; totalElements: number }>
> => {
    const changedSince = startOfToday();
    return useInfiniteQuery({
        queryKey: timeOffKeys.ownRequestsSince(changedSince),
        queryFn: ({ pageParam }) => timeOffApi.ownRequests(pageParam, REQUESTS_PAGE_SIZE, changedSince),
        initialPageParam: 0,
        getNextPageParam: (last, pages) =>
            pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements ? pages.length : undefined,
    });
};

/** Not optimistic; balances and requests are refetched. */
const useOwnTimeOffMutation = <TVariables>(mutationFn: (variables: TVariables) => Promise<TimeOffRequest>) => {
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

export const useCreateTimeOffRequest = (): UseMutationResult<
    {
        id: string;
        type: components['schemas']['TimeOffType_Output'];
        startsAt: string;
        endsAt: string;
        days: number;
        status: components['schemas']['TimeOffStatus_Output'];
        note: string | null;
        decisionComment: string | null;
        createdAt: string;
        decidedAt: string | null;
        decidedBy: { id: string; firstName: string; lastName: string; positionTitle: string | null } | null;
        responsibles: { id: string; firstName: string; lastName: string; positionTitle: string | null }[];
        history: {
            id: string;
            action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'RESPONSIBLES_CHANGED';
            occurredAt: string;
            actor: { id: string; firstName: string; lastName: string; positionTitle: string | null } | null;
        }[];
        comments: components['schemas']['TimeOffComment_Output'][];
        commentCount: number;
        canCancel: boolean;
    },
    ApiError,
    { request: CreateTimeOffRequest; idempotencyKey: string }
> =>
    useOwnTimeOffMutation(({ request, idempotencyKey }: { request: CreateTimeOffRequest; idempotencyKey: string }) =>
        timeOffApi.create(request, idempotencyKey),
    );

export const useCancelTimeOffRequest = (): UseMutationResult<
    {
        id: string;
        type: components['schemas']['TimeOffType_Output'];
        startsAt: string;
        endsAt: string;
        days: number;
        status: components['schemas']['TimeOffStatus_Output'];
        note: string | null;
        decisionComment: string | null;
        createdAt: string;
        decidedAt: string | null;
        decidedBy: { id: string; firstName: string; lastName: string; positionTitle: string | null } | null;
        responsibles: { id: string; firstName: string; lastName: string; positionTitle: string | null }[];
        history: {
            id: string;
            action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'RESPONSIBLES_CHANGED';
            occurredAt: string;
            actor: { id: string; firstName: string; lastName: string; positionTitle: string | null } | null;
        }[];
        comments: components['schemas']['TimeOffComment_Output'][];
        commentCount: number;
        canCancel: boolean;
    },
    ApiError,
    string
> => useOwnTimeOffMutation((requestId: string) => timeOffApi.cancel(requestId));
