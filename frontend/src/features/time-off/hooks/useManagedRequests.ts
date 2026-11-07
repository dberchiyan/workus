import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { commentsApi } from '../api/commentsApi';
import { managedRequestsApi, type ManagedRequestsQuery } from '../api/managedRequestsApi';
import type { ManagedRequest, ManagedRequestPage, TimeOffComment, TimeOffDecision } from '../types';
import { timeOffKeys } from './queryKeys';

/** A filter change keeps the previous page on screen until the new one arrives. */
export const useManagedRequests = (query: ManagedRequestsQuery) =>
  useQuery({
    queryKey: timeOffKeys.managedList(query),
    queryFn: () => managedRequestsApi.list(query),
    placeholderData: keepPreviousData,
  });

/** The open request; a list row already on screen shows at once while it loads. */
export const useManagedRequest = (requestId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: timeOffKeys.managedRequest(requestId),
    queryFn: () => managedRequestsApi.get(requestId),
    placeholderData: () =>
      queryClient
        .getQueriesData<ManagedRequestPage>({ queryKey: timeOffKeys.managedLists() })
        .flatMap(([, page]) => page?.content ?? [])
        .find((request) => request.id === requestId),
  });
};

/**
 * Approve, reject or cancel. The answer is the request as it is now; lists, balances and the
 * dashboard are refetched (a decision moves it between sections and changes balances).
 */
export const useDecideRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ManagedRequest,
    ApiError,
    { requestId: string; decision: TimeOffDecision; comment?: string }
  >({
    mutationFn: ({ requestId, decision, comment }) =>
      managedRequestsApi.decide(requestId, decision, comment),
    // Refetches run in the background: the answer already shows the new state.
    onSuccess: (request) => {
      queryClient.setQueryData(timeOffKeys.managedRequest(request.id), request);
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      // The dashboard's cards count pending requests (its key, not imported: no feature cycle).
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/** Adds the new comment to the open request; the lists refetch in the background. */
/** Where a comment is written: the admin's Requests dialog, or the employee's own request. */
export type CommentScope = 'managed' | 'own';

/** Comment caches to refresh: the open request (admin) and the employee's own lists. */
const useCommentCaches = (requestId: string) => {
  const queryClient = useQueryClient();
  return (change: (comments: TimeOffComment[]) => TimeOffComment[], countDelta: number) => {
    queryClient.setQueryData<ManagedRequest>(
      timeOffKeys.managedRequest(requestId),
      (request) =>
        request && {
          ...request,
          comments: change(request.comments),
          commentCount: request.commentCount + countDelta,
        },
    );
    void queryClient.invalidateQueries({ queryKey: timeOffKeys.managedLists() });
    void queryClient.invalidateQueries({ queryKey: timeOffKeys.ownRequests() });
  };
};

export const useAddComment = (requestId: string, scope: CommentScope) => {
  const refresh = useCommentCaches(requestId);
  return useMutation<TimeOffComment, ApiError, { body: string; idempotencyKey: string }>({
    mutationFn: ({ body, idempotencyKey }) =>
      scope === 'managed'
        ? managedRequestsApi.comment(requestId, body, idempotencyKey)
        : commentsApi.addOwn(requestId, body, idempotencyKey),
    onSuccess: (comment) => {
      refresh((comments) => [...comments, comment], 1);
    },
  });
};

/** The author edits their comment. */
export const useEditComment = (requestId: string) => {
  const refresh = useCommentCaches(requestId);
  return useMutation<TimeOffComment, ApiError, { commentId: string; body: string }>({
    mutationFn: ({ commentId, body }) => commentsApi.edit(requestId, commentId, body),
    onSuccess: (updated) => {
      refresh((comments) => comments.map((item) => (item.id === updated.id ? updated : item)), 0);
    },
  });
};

/** The author deletes their comment. */
export const useDeleteComment = (requestId: string) => {
  const refresh = useCommentCaches(requestId);
  return useMutation<unknown, ApiError, string>({
    mutationFn: (commentId) => commentsApi.remove(requestId, commentId),
    onSuccess: (_result, commentId) => {
      refresh((comments) => comments.filter((item) => item.id !== commentId), -1);
    },
  });
};

/** Admins who can decide requests, as the picker searches (only while its dialog is open). */
export const useRequestResponsibleCandidates = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: timeOffKeys.candidates(search),
    queryFn: () => managedRequestsApi.candidates(search),
    enabled,
    placeholderData: keepPreviousData,
  });

/** Replace who decides a pending request; the answer is the request as it is now. */
export const useUpdateRequestResponsibles = (requestId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ManagedRequest, ApiError, string[]>({
    mutationFn: (responsibleUserIds) =>
      managedRequestsApi.updateResponsibles(requestId, responsibleUserIds),
    onSuccess: (request) => {
      queryClient.setQueryData(timeOffKeys.managedRequest(request.id), request);
      // "Only requests I decide" and the cards' responsible lists change.
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.managedLists() });
    },
  });
};
