import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { accountApi } from '../api/accountApi';
import type { ChangePasswordRequest } from '../types';
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

/** Own security log, a page at a time (the previous page stays while the next loads). */
export const useOwnSecurityLog = (page: number) =>
  useQuery({
    queryKey: authKeys.securityLog(page),
    queryFn: () => accountApi.securityLog(page),
    placeholderData: keepPreviousData,
  });
