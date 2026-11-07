import { QueryClient } from '@tanstack/react-query';
import { ApiContractError, isApiError } from '@/shared/api/apiError';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Never retry a 4xx (data.md → Server state), nor an answer that breaks the contract.
      retry: (failureCount, error) =>
        !(isApiError(error) && error.isClientError) &&
        !(error instanceof ApiContractError) &&
        failureCount < MAX_RETRIES,
    },
    mutations: { retry: false },
  },
});
