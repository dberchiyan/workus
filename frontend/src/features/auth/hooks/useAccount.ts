import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { accountApi } from '../api/accountApi';
import type { ChangePasswordRequest, SecurityCategory, UpdateOwnNameRequest } from '../types';
import { authKeys } from './queryKeys';

/** Another page keeps the previous rows on screen until the new ones arrive. */
export const useSessions = (page: number) =>
  useQuery({
    queryKey: authKeys.sessionsPage(page),
    queryFn: () => accountApi.sessions(page),
    placeholderData: keepPreviousData,
  });

/**
 * The name shows across the app (account menu, people lists, requests, notices), so every query
 * on screen is read again — /auth/me first.
 */
export const useUpdateOwnName = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, UpdateOwnNameRequest>({
    mutationFn: accountApi.updateName,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
      void queryClient.invalidateQueries();
    },
  });
};

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

/** Own security log, newest first, filtered by category, one page (`SECURITY_LOG_PAGE_SIZE`). */
export const useOwnSecurityLog = (category: SecurityCategory | undefined, page: number) =>
  useQuery({
    queryKey: authKeys.securityLog(category, page),
    queryFn: () => accountApi.securityLog(category, page),
    // Another page or filter keeps the current rows on screen until its own arrive.
    placeholderData: keepPreviousData,
  });
