import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/features/auth';
import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { organisationApi } from '../api/organisation-api';
import type {
    AddAdministratorRequest,
    AddedAdministrator,
    Administrator,
    AdministratorPage,
    ChangeRoleRequest,
    Organisation,
    RegistrationRequest,
    UpdateOrganisationRequest,
} from '../types';
import { organisationKeys } from './query-keys';

/**
 * Registers a company. The answer signs the new owner in, so everything cached for the visitor
 * (e.g. "not signed in") is dropped and the app loads afresh as them.
 */
export const useRegister = (): UseMutationResult<
    { id: string; name: string; version: number },
    ApiError,
    { organisationName: string; firstName: string; lastName: string; email: string; password: unknown }
> => {
    const queryClient = useQueryClient();
    return useMutation<Organisation, ApiError, RegistrationRequest>({
        mutationFn: organisationApi.register,
        onSuccess: () => {
            queryClient.clear();
        },
    });
};

export const useOrganisation = (): UseQueryResult<{ id: string; name: string; version: number }> =>
    useQuery({ queryKey: organisationKeys.current(), queryFn: organisationApi.find });

/** The name changes everywhere it shows (the account menu reads it from the signed-in user). */
export const useRenameOrganisation = (): UseMutationResult<
    { id: string; name: string; version: number },
    ApiError,
    { name: string; version: number }
> => {
    const queryClient = useQueryClient();
    return useMutation<Organisation, ApiError, UpdateOrganisationRequest>({
        mutationFn: organisationApi.rename,
        onSuccess: async (organisation) => {
            queryClient.setQueryData(organisationKeys.current(), organisation);
            // The account menu shows the name from /auth/me.
            await queryClient.invalidateQueries({ queryKey: authKeys.me() });
        },
    });
};

export const useAdministrators = (
    search: string,
    page: number,
): UseQueryResult<{ content: components['schemas']['Administrator_Output'][]; totalElements: number }> =>
    useQuery<AdministratorPage>({
        queryKey: organisationKeys.administratorsPage(search, page),
        queryFn: () => organisationApi.administrators(search, page),
        placeholderData: keepPreviousData,
    });

/**
 * Changing someone's role ends their sessions; changing one's own keeps this session with the
 * new rights — so the signed-in user is re-read too.
 */
export const useChangeRole = (): UseMutationResult<
    {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: components['schemas']['AdministratorRole_Output'];
        version: number;
    },
    ApiError,
    { userId: string; request: ChangeRoleRequest }
> => {
    const queryClient = useQueryClient();
    return useMutation<Administrator, ApiError, { userId: string; request: ChangeRoleRequest }>({
        mutationFn: ({ userId, request }) => organisationApi.changeRole(userId, request),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: organisationKeys.administrators() }),
                queryClient.invalidateQueries({ queryKey: authKeys.me() }),
            ]);
        },
    });
};

/** Adds an admin (owners). The answer holds the generated password: never kept in the cache. */
export const useAddAdministrator = (): UseMutationResult<
    {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: components['schemas']['AdministratorRole_Output'];
        version: number;
        temporaryPassword: string | null;
    },
    ApiError,
    { request: AddAdministratorRequest; idempotencyKey: string }
> => {
    const queryClient = useQueryClient();
    return useMutation<AddedAdministrator, ApiError, { request: AddAdministratorRequest; idempotencyKey: string }>({
        mutationFn: ({ request, idempotencyKey }) => organisationApi.addAdministrator(request, idempotencyKey),
        gcTime: 0,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: organisationKeys.administrators() });
        },
    });
};
