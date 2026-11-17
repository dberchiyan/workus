import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { employeeReviewsKey } from '@/features/employee/review';
import type { ApiError } from '@/shared/api/api-error';
import { MINUTE_MS } from '@/shared/lib/units';
import type { components } from '@/shared/types/api';

import { employeeApi } from '../api/employee-api';
import { EmployeeProfilePage } from '../route-pages';
import type {
    CreatedEmployee,
    CreateEmployeeRequest,
    EmployeeFilters,
    EmployeeListParams,
    EmployeeProfile,
    PasswordReset,
    TerminateEmployeeRequest,
    UpdateEmployeeRequest,
    UpdateResponsiblesRequest,
} from '../types';
import { employeeKeys } from './query-keys';

const QUICK_SEARCH_SIZE = 6;

export const useEmployees = (
    params: EmployeeListParams,
    enabled = true,
): UseQueryResult<{ content: components['schemas']['EmployeeListItem_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: employeeKeys.list(params),
        queryFn: () => employeeApi.list(params),
        placeholderData: keepPreviousData,
        enabled,
    });

/** A few active people by name or email — the command menu's people search (shell). */
export const useEmployeeQuickSearch = (
    search: string,
    enabled: boolean,
): UseQueryResult<{ content: components['schemas']['EmployeeListItem_Output'][]; totalElements: number }> =>
    useEmployees(
        {
            categoryId: undefined,
            status: 'ACTIVE',
            search,
            page: 1,
            size: QUICK_SEARCH_SIZE,
            sortField: 'name',
            sortDirection: 'asc',
        },
        enabled,
    );

export const useEmployeeSummary = (): UseQueryResult<{
    totalActive: number;
    newLast30Days: number;
    terminatedLast90Days: number;
    averageTenureDays: number;
    withoutResponsible: number;
}> => useQuery({ queryKey: employeeKeys.summary(), queryFn: employeeApi.summary });

export const usePositionCategories = (
    filters: EmployeeFilters,
): UseQueryResult<{ total: number; categories: { id: string; name: string; employeeCount: number }[] }> =>
    useQuery({
        queryKey: employeeKeys.categories(filters),
        queryFn: () => employeeApi.categories(filters),
        placeholderData: keepPreviousData,
    });

const POSITIONS_STALE_MINUTES = 5;
const POSITIONS_STALE_MS = POSITIONS_STALE_MINUTES * MINUTE_MS;

export const usePositionOptions = (
    enabled: boolean,
): UseQueryResult<{ id: string; title: string; category: { id: string; name: string } }[]> =>
    useQuery({
        queryKey: employeeKeys.positions(),
        queryFn: employeeApi.positions,
        staleTime: POSITIONS_STALE_MS,
        enabled,
    });

export const useResponsibleCandidates = (
    search: string,
    enabled: boolean,
): UseQueryResult<
    {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
        positionTitle: string | null;
    }[]
> =>
    useQuery({
        queryKey: employeeKeys.responsibleCandidates(search),
        queryFn: () => employeeApi.responsibleCandidates(search),
        placeholderData: keepPreviousData,
        enabled,
    });

/** Not optimistic; on success the list, cards and tab counts are refetched. */
export const useCreateEmployee = (): UseMutationResult<
    { id: string; firstName: string; lastName: string; temporaryPassword: string | null },
    ApiError,
    { request: CreateEmployeeRequest; idempotencyKey: string }
> => {
    const queryClient = useQueryClient();
    return useMutation<CreatedEmployee, ApiError, { request: CreateEmployeeRequest; idempotencyKey: string }>({
        mutationFn: ({ request, idempotencyKey }) => employeeApi.create(request, idempotencyKey),
        gcTime: 0,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
                queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'categories'] }),
                queryClient.invalidateQueries({
                    queryKey: [...employeeKeys.all, 'responsible-candidates'],
                }),
            ]);
        },
    });
};

/** Not optimistic; on success the profile, its history, the list and the cards are refetched. */
export const useUpdateResponsibles = (
    employeeId: string,
): UseMutationResult<
    {
        id: string;
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
        position: { id: string; title: string; category: { id: string; name: string } };
        startsAt: string;
        bornAt: string | null;
        terminatedAt: string | null;
        termination: { reason: components['schemas']['TerminationReason_Output']; comment: string | null } | null;
        status: components['schemas']['EmployeeStatus_Output'];
        contacts: {
            mobile: string | null;
            personalEmail: string | null;
            linkedinUrl: string | null;
            telegram: string | null;
            address: string | null;
        };
        responsibles: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
            positionTitle: string | null;
        }[];
        createdAt: string;
        version: number;
    },
    ApiError,
    { responsibleUserIds: string[]; version: number }
> => {
    const queryClient = useQueryClient();
    return useMutation<EmployeeProfile, ApiError, UpdateResponsiblesRequest>({
        mutationFn: (request) => employeeApi.updateResponsibles(employeeId, request),
        onSuccess: async (profile) => {
            queryClient.setQueryData(employeeKeys.detail(employeeId), profile);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: employeeKeys.activity(employeeId) }),
                queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
            ]);
        },
    });
};

/**
 * Profile edits, terminations and their cancellation change the profile, its history, the list,
 * the cards, the tab counts and — through the start date or canceled reviews — the reviews.
 * Not optimistic.
 */
const useEmploymentMutation = <TVariables>(
    employeeId: string,
    mutationFn: (variables: TVariables) => Promise<void>,
) => {
    const queryClient = useQueryClient();
    return useMutation<unknown, ApiError, TVariables>({
        mutationFn,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) }),
                queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: employeeKeys.summary() }),
                queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'categories'] }),
                queryClient.invalidateQueries({
                    queryKey: [...employeeKeys.all, 'responsible-candidates'],
                }),
                queryClient.invalidateQueries({ queryKey: employeeReviewsKey(employeeId) }),
            ]);
        },
    });
};

export const useUpdateEmployee = (
    employeeId: string,
): UseMutationResult<
    unknown,
    ApiError,
    {
        firstName: string;
        lastName: string;
        email: string;
        positionId: string;
        startsAt: string;
        mobile?: string;
        personalEmail?: string;
        linkedinUrl?: string;
        telegram?: string;
        address?: string;
        bornAt?: string;
        version: number;
    }
> => useEmploymentMutation(employeeId, (request: UpdateEmployeeRequest) => employeeApi.update(employeeId, request));

export const useTerminateEmployee = (
    employeeId: string,
): UseMutationResult<
    unknown,
    ApiError,
    { terminatedAt: string; reason: components['schemas']['TerminationReason']; comment?: string; version: number }
> =>
    useEmploymentMutation(employeeId, (request: TerminateEmployeeRequest) =>
        employeeApi.terminate(employeeId, request),
    );

export const useCancelTermination = (employeeId: string): UseMutationResult<unknown, ApiError, number> =>
    useEmploymentMutation(employeeId, (version: number) => employeeApi.cancelTermination(employeeId, version));

const profileQuery = (employeeId: string) => ({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => employeeApi.profile(employeeId),
});

export const useEmployeeProfile = (
    employeeId: string,
): UseQueryResult<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    position: { id: string; title: string; category: { id: string; name: string } };
    startsAt: string;
    bornAt: string | null;
    terminatedAt: string | null;
    termination: { reason: components['schemas']['TerminationReason_Output']; comment: string | null } | null;
    status: components['schemas']['EmployeeStatus_Output'];
    contacts: {
        mobile: string | null;
        personalEmail: string | null;
        linkedinUrl: string | null;
        telegram: string | null;
        address: string | null;
    };
    responsibles: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
        positionTitle: string | null;
    }[];
    createdAt: string;
    version: number;
}> => useQuery(profileQuery(employeeId));

const PREFETCH_FRESH_MS = 30_000;

/**
 * Hover or focus on a link to a profile: fetch the page's code and the profile ahead, so the
 * click shows it at once. Repeated calls within the freshness window do nothing.
 */
export const usePrefetchEmployeeProfile = (): ((employeeId: string) => void) => {
    const queryClient = useQueryClient();
    return (employeeId) => {
        void EmployeeProfilePage.preload();
        queryClient.query({ ...profileQuery(employeeId), staleTime: PREFETCH_FRESH_MS }).catch(() => undefined);
    };
};

/**
 * Gives the employee a new generated password (they are signed out everywhere). The answer holds
 * the password: never kept in the mutation cache. Their security log changes.
 */
export const useResetPassword = (
    employeeId: string,
): UseMutationResult<{ temporaryPassword: string | null }, ApiError, string> => {
    const queryClient = useQueryClient();
    return useMutation<PasswordReset, ApiError, string>({
        mutationFn: (idempotencyKey) => employeeApi.resetPassword(employeeId, idempotencyKey),
        gcTime: 0,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: [...employeeKeys.detail(employeeId), 'security-log'],
            });
        },
    });
};
