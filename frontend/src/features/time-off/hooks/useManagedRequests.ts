import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
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
  return useMutation<ManagedRequest, ApiError, { requestId: string; decision: TimeOffDecision }>({
    mutationFn: ({ requestId, decision }) => managedRequestsApi.decide(requestId, decision),
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
export const useAddComment = (requestId: string) => {
  const queryClient = useQueryClient();
  return useMutation<TimeOffComment, ApiError, { body: string; idempotencyKey: string }>({
    mutationFn: ({ body, idempotencyKey }) =>
      managedRequestsApi.comment(requestId, body, idempotencyKey),
    onSuccess: (comment) => {
      queryClient.setQueryData<ManagedRequest>(
        timeOffKeys.managedRequest(requestId),
        (request) =>
          request && {
            ...request,
            comments: [...request.comments, comment],
            commentCount: request.commentCount + 1,
          },
      );
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.managedLists() });
    },
  });
};
