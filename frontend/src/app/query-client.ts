import { QueryClient } from '@tanstack/react-query';

import { ApiContractError, isApiError } from '@/shared/api/api-error';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) =>
                !(isApiError(error) && error.isClientError) &&
                !(error instanceof ApiContractError) &&
                failureCount < MAX_RETRIES,
        },
        mutations: { retry: false },
    },
});
