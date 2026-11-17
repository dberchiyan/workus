import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { reviewApi } from '../api/review-api';
import type { CreateReviewRequest, Review, UpdateReviewRequest } from '../types';
import { reviewKeys } from './query-keys';

export const useEmployeeReviews = (
    employeeId: string,
): UseQueryResult<{
    salary: {
        current: components['schemas']['Money_Output'] | null;
        previous: components['schemas']['Money_Output'] | null;
        changePercent: string | null;
        history: { reviewedAt: string; salary: components['schemas']['Money_Output'] }[];
    };
    content: components['schemas']['Review_Output'][];
}> =>
    useQuery({
        queryKey: reviewKeys.forEmployee(employeeId),
        queryFn: () => reviewApi.list(employeeId),
    });

export const useReviewCandidates = (
    search: string,
    enabled: boolean,
): UseQueryResult<
    {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
        positionTitle: string | null;
    }[]
> =>
    useQuery({
        queryKey: reviewKeys.candidates(search),
        queryFn: () => reviewApi.candidates(search),
        placeholderData: keepPreviousData,
        enabled,
    });

/** Not optimistic (salary data); the employee's reviews and salary are refetched on success. */
export const useCreateReview = (
    employeeId: string,
): UseMutationResult<
    {
        id: string;
        kind: components['schemas']['ReviewKind_Output'];
        title: string;
        reviewedAt: string;
        status: components['schemas']['ReviewStatus_Output'];
        salary: components['schemas']['Money_Output'] | null;
        responsibles: { id: string; firstName: string; lastName: string }[];
        feedback: {
            hr: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            teamLead: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            team: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            client: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
        };
        createdAt: string;
        version: number;
    },
    ApiError,
    { request: CreateReviewRequest; idempotencyKey: string }
> => {
    const queryClient = useQueryClient();
    return useMutation<Review, ApiError, { request: CreateReviewRequest; idempotencyKey: string }>({
        mutationFn: ({ request, idempotencyKey }) => reviewApi.create(employeeId, request, idempotencyKey),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
        },
    });
};

/** Not optimistic (salary data). A 409 also refetches, so the next edit starts from fresh data. */
export const useUpdateReview = (
    employeeId: string,
): UseMutationResult<
    {
        id: string;
        kind: components['schemas']['ReviewKind_Output'];
        title: string;
        reviewedAt: string;
        status: components['schemas']['ReviewStatus_Output'];
        salary: components['schemas']['Money_Output'] | null;
        responsibles: { id: string; firstName: string; lastName: string }[];
        feedback: {
            hr: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            teamLead: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            team: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            client: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
        };
        createdAt: string;
        version: number;
    },
    ApiError,
    { reviewId: string; request: UpdateReviewRequest }
> => {
    const queryClient = useQueryClient();
    return useMutation<Review, ApiError, { reviewId: string; request: UpdateReviewRequest }>({
        mutationFn: ({ reviewId, request }) => reviewApi.update(employeeId, reviewId, request),
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
        },
    });
};

/** Irreversible: never optimistic. */
export const useDeleteReview = (employeeId: string): UseMutationResult<unknown, ApiError, string> => {
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError, string>({
        mutationFn: (reviewId) => reviewApi.remove(employeeId, reviewId),
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
        },
    });
};
