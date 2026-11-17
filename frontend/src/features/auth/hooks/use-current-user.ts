import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { isApiError } from '@/shared/api/api-error';
import { HttpStatus } from '@/shared/api/http-status';
import { PATHS } from '@/shared/lib/paths';
import { MINUTE_MS } from '@/shared/lib/units';
import type { components } from '@/shared/types/api';

import { authApi } from '../api/auth-api';
import type { CurrentUser } from '../types';
import { authKeys } from './query-keys';

/**
 * "Who am I" — `null` means signed out. Never a stored boolean. A dead session at `/` reloads
 * the page: the server has just cleared its cookie, so `/` now opens the landing page (where there
 * is no landing — local Vite — the reload finds no cookie and goes to sign-in as usual).
 */
const ME_STALE_MINUTES = 5;
const ME_STALE_MS = ME_STALE_MINUTES * MINUTE_MS;

export const useCurrentUser = (): UseQueryResult<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: components['schemas']['UserRole_Output'];
    organisation: {
        id: string;
        name: string;
        status: components['schemas']['OrganisationStatus_Output'];
        rejectionReason: string | null;
        billing: {
            plan: components['schemas']['Plan_Output'];
            features: components['schemas']['PlanFeature_Output'][];
            maxEmployees: number | null;
            graceEndsAt: string | null;
        };
    };
    idleTimeoutMinutes: number;
    isDemoRestricted: boolean;
} | null> =>
    useQuery<CurrentUser | null>({
        queryKey: authKeys.me(),
        queryFn: async () => {
            try {
                return await authApi.me();
            } catch (error) {
                if (isApiError(error) && error.status === HttpStatus.UNAUTHORIZED) {
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
        staleTime: ME_STALE_MS,
    });
