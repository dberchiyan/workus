import { apiClient } from '@/shared/api/client';
import type {
  CreateReviewRequest,
  EmployeeReviews,
  Review,
  ReviewCandidate,
  UpdateReviewRequest,
} from '../types';

const base = (employeeId: string): string =>
  `/api/v1/employees/${encodeURIComponent(employeeId)}/reviews`;

export const reviewApi = {
  list: async (employeeId: string): Promise<EmployeeReviews> =>
    (await apiClient.get<EmployeeReviews>(base(employeeId))).data,
  /** The key identifies one logical "add review" — reused on retry so it never adds twice. */
  create: async (
    employeeId: string,
    request: CreateReviewRequest,
    idempotencyKey: string,
  ): Promise<Review> =>
    (
      await apiClient.post<Review>(base(employeeId), request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  /** Sends the version read; a stale one is 409 CONCURRENT_MODIFICATION. */
  update: async (
    employeeId: string,
    reviewId: string,
    request: UpdateReviewRequest,
  ): Promise<Review> =>
    (await apiClient.put<Review>(`${base(employeeId)}/${encodeURIComponent(reviewId)}`, request))
      .data,
  remove: async (employeeId: string, reviewId: string): Promise<void> => {
    await apiClient.delete(`${base(employeeId)}/${encodeURIComponent(reviewId)}`);
  },
  candidates: async (search: string): Promise<ReviewCandidate[]> =>
    (
      await apiClient.get<{ content: ReviewCandidate[] }>('/api/v1/responsible-candidates', {
        params: search ? { search } : {},
      })
    ).data.content,
};
