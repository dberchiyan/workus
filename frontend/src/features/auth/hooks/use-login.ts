import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { authApi } from '../api/auth-api';
import type { CurrentUser, LoginRequest } from '../types';
import { authKeys } from './query-keys';

export const useLogin = (): UseMutationResult<
    {
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
    },
    ApiError,
    { email: string; password: string }
> => {
    const queryClient = useQueryClient();
    return useMutation<CurrentUser, ApiError, LoginRequest>({
        mutationFn: authApi.login,
        onSuccess: (user) => {
            queryClient.setQueryData(authKeys.me(), user);
        },
    });
};
