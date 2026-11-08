import { apiClient } from '@/shared/api/client';
import type {
  Company,
  CompanyCounts,
  CompanyPage,
  CompanyPeople,
  CompanyStatus,
  CompanyUserPage,
} from '../types';

export const COMPANIES_PAGE_SIZE = 20;
export const COMPANY_PEOPLE_PAGE_SIZE = 10;

const BASE = '/api/v1/platform/organisations';

/** Workus platform administration (platform admins only). */
export const platformApi = {
  /** Waiting companies oldest first (the queue); the others newest first. */
  companies: async (status: CompanyStatus, search: string, page: number): Promise<CompanyPage> =>
    (
      await apiClient.get<CompanyPage>(BASE, {
        params: {
          status,
          search: search || undefined,
          page,
          size: COMPANIES_PAGE_SIZE,
          sort: status === 'PENDING' ? 'createdAt,asc' : 'createdAt,desc',
        },
      })
    ).data,
  counts: async (): Promise<CompanyCounts> =>
    (await apiClient.get<CompanyCounts>(`${BASE}/counts`)).data,
  company: async (organisationId: string): Promise<Company> =>
    (await apiClient.get<Company>(`${BASE}/${encodeURIComponent(organisationId)}`)).data,
  people: async (
    organisationId: string,
    people: CompanyPeople,
    search: string,
    page: number,
  ): Promise<CompanyUserPage> =>
    (
      await apiClient.get<CompanyUserPage>(`${BASE}/${encodeURIComponent(organisationId)}/users`, {
        params: { people, search: search || undefined, page, size: COMPANY_PEOPLE_PAGE_SIZE },
      })
    ).data,
  approve: async (organisationId: string): Promise<Company> =>
    (await apiClient.post<Company>(`${BASE}/${encodeURIComponent(organisationId)}/approval`)).data,
  reject: async (organisationId: string, reason: string): Promise<Company> =>
    (
      await apiClient.post<Company>(`${BASE}/${encodeURIComponent(organisationId)}/rejection`, {
        reason,
      })
    ).data,
};
