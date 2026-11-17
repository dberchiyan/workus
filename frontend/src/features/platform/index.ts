import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const CompaniesPage = lazyWithPreload(async () => ({
    default: (await import('./pages/companies-page')).CompaniesPage,
}));
export const CompanyPage = lazyWithPreload(async () => ({
    default: (await import('./pages/company-page')).CompanyPage,
}));
