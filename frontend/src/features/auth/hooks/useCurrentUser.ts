import { useQuery } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/apiError';
import { PATHS } from '@/shared/lib/paths';
import { authApi } from '../api/authApi';
import type { CurrentUser } from '../types';
import { authKeys } from './queryKeys';

/**
 * "Who am I" — `null` means signed out. Never a stored boolean. A dead session at `/` reloads
 * the page: the server has just cleared its cookie, so `/` now opens the landing page (where there
 * is no landing — local Vite — the reload finds no cookie and goes to sign-in as usual).
 */
export const useCurrentUser = () =>
  useQuery<CurrentUser | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          if (error.code === 'SESSION_EXPIRED' && window.location.pathname === PATHS.dashboard) {
            window.location.replace(PATHS.dashboard);
            // The page is being replaced; stay pending so sign-in does not flash first.
            return new Promise<never>(() => undefined);
          }
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
