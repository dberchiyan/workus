import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/apiError';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Never retry a 4xx (data.md → Server state).
      retry: (failureCount, error) =>
        !(isApiError(error) && error.isClientError) && failureCount < MAX_RETRIES,
    },
    mutations: { retry: false },
  },
});
