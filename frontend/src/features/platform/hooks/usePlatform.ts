import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { platformApi } from '../api/platformApi';
import type { Company, CompanyPeople, CompanyStatus } from '../types';

/** Platform data is not tenant data: the platform admin's cache is cleared on sign-out too. */
export const platformKeys = {
  all: ['platform'] as const,
  companies: () => [...platformKeys.all, 'companies'] as const,
  companyPage: (status: CompanyStatus, search: string, page: number) =>
    [...platformKeys.companies(), 'page', status, search, page] as const,
  counts: () => [...platformKeys.companies(), 'counts'] as const,
  company: (id: string) => [...platformKeys.companies(), 'one', id] as const,
  people: (id: string, people: CompanyPeople, search: string, page: number) =>
    [...platformKeys.company(id), 'people', people, search, page] as const,
};

export const useCompanies = (status: CompanyStatus, search: string, page: number) =>
  useQuery({
    queryKey: platformKeys.companyPage(status, search, page),
    queryFn: () => platformApi.companies(status, search, page),
    placeholderData: keepPreviousData,
  });

export const useCompanyCounts = () =>
  useQuery({ queryKey: platformKeys.counts(), queryFn: platformApi.counts });

export const useCompany = (id: string) =>
  useQuery({ queryKey: platformKeys.company(id), queryFn: () => platformApi.company(id) });

export const useCompanyPeople = (id: string, people: CompanyPeople, search: string, page: number) =>
  useQuery({
    queryKey: platformKeys.people(id, people, search, page),
    queryFn: () => platformApi.people(id, people, search, page),
    placeholderData: keepPreviousData,
  });

/** Approve or reject: the company, the lists and the counts change. */
export const useDecideCompany = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    Company,
    ApiError,
    { decision: 'approve' } | { decision: 'reject'; reason: string }
  >({
    mutationFn: (input) =>
      input.decision === 'approve' ? platformApi.approve(id) : platformApi.reject(id, input.reason),
    onSuccess: async (company) => {
      queryClient.setQueryData(platformKeys.company(id), company);
      await queryClient.invalidateQueries({ queryKey: platformKeys.companies() });
    },
  });
};
