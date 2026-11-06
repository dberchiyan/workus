import { useQuery } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/apiError';
import { authApi } from '../api/authApi';
import type { CurrentUser } from '../types';
import { authKeys } from './queryKeys';

/** "Who am I" — `null` means signed out. Never a stored boolean. */
export const useCurrentUser = () =>
  useQuery<CurrentUser | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
