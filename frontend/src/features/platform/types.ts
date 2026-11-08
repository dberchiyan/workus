import type { Schemas } from '@/shared/types';

export type Company = Schemas['Company_Output'];
export type CompanyStatus = Schemas['CompanyStatus_Output'];
export type CompanyPage = Schemas['CompanyPageResponse_Output'];
export type CompanyCounts = Schemas['CompanyCountsResponse_Output'];
export type CompanyUser = Schemas['CompanyUser_Output'];
export type CompanyUserPage = Schemas['CompanyUserPageResponse_Output'];
/** The people tabs of a company: owners, admins, employees (managers included). */
export type CompanyPeople = 'OWNER' | 'ADMIN' | 'EMPLOYEE';
