import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { PATHS } from '@/shared/lib/paths';
import { authApi } from '../api/authApi';

/** Logout → POST /auth/logout → queryClient.clear() (data.md → Routing and auth flow). */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      queryClient.clear();
      await navigate(PATHS.login, { replace: true });
    },
  });
};
