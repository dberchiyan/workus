import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { platformApi } from '../api/platform-api';
import type { Company, CompanyPeople, CompanyStatus } from '../types';

export const platformKeys = {
    all: ['platform'] as const,
    companies: (): readonly ['platform', 'companies'] => [...platformKeys.all, 'companies'] as const,
    companyPage: (
        status: CompanyStatus,
        search: string,
        page: number,
    ): readonly ['platform', 'companies', 'page', 'ACTIVE' | 'PENDING' | 'REJECTED', string, number] =>
        [...platformKeys.companies(), 'page', status, search, page] as const,
    counts: (): readonly ['platform', 'companies', 'counts'] => [...platformKeys.companies(), 'counts'] as const,
    company: (id: string): readonly ['platform', 'companies', 'one', string] =>
        [...platformKeys.companies(), 'one', id] as const,
    people: (
        id: string,
        people: CompanyPeople,
        search: string,
        page: number,
    ): readonly ['platform', 'companies', 'one', string, 'people', CompanyPeople, string, number] =>
        [...platformKeys.company(id), 'people', people, search, page] as const,
};

export const useCompanies = (
    status: CompanyStatus,
    search: string,
    page: number,
): UseQueryResult<{ content: components['schemas']['Company_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: platformKeys.companyPage(status, search, page),
        queryFn: () => platformApi.companies(status, search, page),
        placeholderData: keepPreviousData,
    });

export const useCompanyCounts = (): UseQueryResult<{ PENDING: number; ACTIVE: number; REJECTED: number }> =>
    useQuery({ queryKey: platformKeys.counts(), queryFn: platformApi.counts });

export const useCompany = (
    id: string,
): UseQueryResult<{
    id: string;
    name: string;
    status: components['schemas']['CompanyStatus_Output'];
    createdAt: string;
    decidedAt: string | null;
    decidedBy: { firstName: string; lastName: string } | null;
    rejectionReason: string | null;
    owners: { id: string; firstName: string; lastName: string; email: string }[];
    adminCount: number;
    activeEmployeeCount: number;
}> => useQuery({ queryKey: platformKeys.company(id), queryFn: () => platformApi.company(id) });

export const useCompanyPeople = (
    id: string,
    people: CompanyPeople,
    search: string,
    page: number,
): UseQueryResult<{ content: components['schemas']['CompanyUser_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: platformKeys.people(id, people, search, page),
        queryFn: () => platformApi.people(id, people, search, page),
        placeholderData: keepPreviousData,
    });

/** Approve or reject: the company, the lists and the counts change. */
export const useDecideCompany = (
    id: string,
): UseMutationResult<
    {
        id: string;
        name: string;
        status: components['schemas']['CompanyStatus_Output'];
        createdAt: string;
        decidedAt: string | null;
        decidedBy: { firstName: string; lastName: string } | null;
        rejectionReason: string | null;
        owners: { id: string; firstName: string; lastName: string; email: string }[];
        adminCount: number;
        activeEmployeeCount: number;
    },
    ApiError,
    { decision: 'approve' } | { decision: 'reject'; reason: string }
> => {
    const queryClient = useQueryClient();
    return useMutation<Company, ApiError, { decision: 'approve' } | { decision: 'reject'; reason: string }>({
        mutationFn: (input) =>
            input.decision === 'approve' ? platformApi.approve(id) : platformApi.reject(id, input.reason),
        onSuccess: async (company) => {
            queryClient.setQueryData(platformKeys.company(id), company);
            await queryClient.invalidateQueries({ queryKey: platformKeys.companies() });
        },
    });
};
