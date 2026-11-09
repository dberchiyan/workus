import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PATHS } from '@/shared/lib/paths';
import { authApi } from '../api/authApi';

/**
 * Logout → POST /auth/logout → queryClient.clear() (data.md → Routing and auth flow), then a full
 * page load of `/`: without the session cookie the server answers it with the landing page (where
 * there is no landing — local Vite — the app shows sign-in, as before).
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      window.location.replace(PATHS.dashboard);
    },
  });
};
