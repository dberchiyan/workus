import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { reviewApi } from '../api/reviewApi';
import type { CreateReviewRequest, Review, UpdateReviewRequest } from '../types';
import { reviewKeys } from './queryKeys';

export const useEmployeeReviews = (employeeId: string) =>
  useQuery({
    queryKey: reviewKeys.forEmployee(employeeId),
    queryFn: () => reviewApi.list(employeeId),
  });

export const useReviewCandidates = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: reviewKeys.candidates(search),
    queryFn: () => reviewApi.candidates(search),
    placeholderData: keepPreviousData,
    enabled,
  });

/** Not optimistic (salary data); the employee's reviews and salary are refetched on success. */
export const useCreateReview = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Review, ApiError, { request: CreateReviewRequest; idempotencyKey: string }>({
    mutationFn: ({ request, idempotencyKey }) =>
      reviewApi.create(employeeId, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
    },
  });
};

/** Not optimistic (salary data). A 409 also refetches, so the next edit starts from fresh data. */
export const useUpdateReview = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Review, ApiError, { reviewId: string; request: UpdateReviewRequest }>({
    mutationFn: ({ reviewId, request }) => reviewApi.update(employeeId, reviewId, request),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
    },
  });
};

/** Irreversible: never optimistic. */
export const useDeleteReview = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (reviewId) => reviewApi.remove(employeeId, reviewId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.forEmployee(employeeId) });
    },
  });
};
