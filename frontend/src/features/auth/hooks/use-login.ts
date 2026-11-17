import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/api-error';
import { authApi } from '../api/auth-api';
import type { CurrentUser, LoginRequest } from '../types';
import { authKeys } from './query-keys';

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation<CurrentUser, ApiError, LoginRequest>({
        mutationFn: authApi.login,
        onSuccess: (user) => {
            queryClient.setQueryData(authKeys.me(), user);
        },
    });
};
