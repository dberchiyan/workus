import { apiClient } from '@/shared/api/client';
import type { TimeOffComment } from '../types';

const commentUrl = (requestId: string, commentId: string): string =>
  `/api/v1/time-off-requests/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}`;

/** Comments: the employee writes on their own request; only the author edits or deletes one. */
export const commentsApi = {
  /** The key identifies one logical "send" — reused on retry so it never posts twice. */
  addOwn: async (
    requestId: string,
    body: string,
    idempotencyKey: string,
  ): Promise<TimeOffComment> =>
    (
      await apiClient.post<TimeOffComment>(
        `/api/v1/time-off/requests/${encodeURIComponent(requestId)}/comments`,
        { body },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      )
    ).data,
  edit: async (requestId: string, commentId: string, body: string): Promise<TimeOffComment> =>
    (await apiClient.put<TimeOffComment>(commentUrl(requestId, commentId), { body })).data,
  remove: async (requestId: string, commentId: string): Promise<void> => {
    await apiClient.delete(commentUrl(requestId, commentId));
  },
};
