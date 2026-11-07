import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { accountApi } from '../api/accountApi';
import { nextSecurityLogPage } from '../securityLog';
import type { ChangePasswordRequest, SecurityCategory } from '../types';
import { authKeys } from './queryKeys';

/** Another page keeps the previous rows on screen until the new ones arrive. */
export const useSessions = (page: number) =>
  useQuery({
    queryKey: authKeys.sessionsPage(page),
    queryFn: () => accountApi.sessions(page),
    placeholderData: keepPreviousData,
  });

/** On success the other sessions are gone — the list is read again. */
export const useChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, ChangePasswordRequest>({
    mutationFn: accountApi.changePassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: accountApi.endSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

export const useEndOtherSessions = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError>({
    mutationFn: accountApi.endOtherSessions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

/** Own security log, newest first, filtered by category; "Show more" loads the next page. */
export const useOwnSecurityLog = (category: SecurityCategory | undefined) =>
  useInfiniteQuery({
    queryKey: authKeys.securityLog(category),
    queryFn: ({ pageParam }) => accountApi.securityLog(category, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextSecurityLogPage,
    // Another filter keeps the current rows on screen until its own arrive.
    placeholderData: keepPreviousData,
  });
