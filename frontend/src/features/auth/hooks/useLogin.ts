import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { authApi } from '../api/authApi';
import type { CurrentUser, LoginRequest } from '../types';
import { authKeys } from './queryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<CurrentUser, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
    },
  });
};
