import type { ReactElement } from 'react';
import { RouterProvider } from 'react-router';

import { AUTH_SESSION_ENDPOINTS, type LoginLocationState } from '@/features/auth';
import { setSessionLostHandler } from '@/shared/api/client';
import { PATHS } from '@/shared/lib/paths';

import { Providers } from './providers';
import { queryClient } from './query-client';
import { router } from './router';

setSessionLostHandler((_code, config) => {
    if (config?.url && AUTH_SESSION_ENDPOINTS.includes(config.url)) {
        return;
    }
    queryClient.clear();
    const { pathname, search, hash } = router.state.location;
    const state: LoginLocationState = {
        from: `${pathname}${search}${hash}`,
        reason: 'sessionExpired',
    };
    void router.navigate(PATHS.login, { replace: true, state });
});

export function App(): ReactElement {
    return (
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    );
}
