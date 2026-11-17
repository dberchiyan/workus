import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { accountApi } from '../api/account-api';
import type { ChangePasswordRequest, SecurityCategory, UpdateOwnNameRequest } from '../types';
import { authKeys } from './query-keys';

/** Another page keeps the previous rows on screen until the new ones arrive. */
export const useSessions = (
    page: number,
): UseQueryResult<{
    current: components['schemas']['Session_Output'] | null;
    others: { content: components['schemas']['Session_Output'][]; totalElements: number };
}> =>
    useQuery({
        queryKey: authKeys.sessionsPage(page),
        queryFn: () => accountApi.sessions(page),
        placeholderData: keepPreviousData,
    });

/**
 * The name shows across the app (account menu, people lists, requests, notices), so every query
 * on screen is read again — /auth/me first.
 */
export const useUpdateOwnName = (): UseMutationResult<unknown, ApiError, { firstName: string; lastName: string }> => {
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
export const useChangePassword = (): UseMutationResult<
    unknown,
    ApiError,
    { currentPassword: string; newPassword: unknown }
> => {
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError, ChangePasswordRequest>({
        mutationFn: accountApi.changePassword,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
        },
    });
};

export const useEndSession = (): UseMutationResult<unknown, ApiError, string> => {
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError, string>({
        mutationFn: accountApi.endSession,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
        },
    });
};

export const useEndOtherSessions = (): UseMutationResult<unknown, ApiError, void> => {
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError>({
        mutationFn: accountApi.endOtherSessions,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
        },
    });
};

/** Own security log, newest first, filtered by category, one page (`SECURITY_LOG_PAGE_SIZE`). */
export const useOwnSecurityLog = (
    category: SecurityCategory | undefined,
    page: number,
): UseQueryResult<{ content: components['schemas']['SecurityEvent_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: authKeys.securityLog(category, page),
        queryFn: () => accountApi.securityLog(category, page),
        placeholderData: keepPreviousData,
    });
