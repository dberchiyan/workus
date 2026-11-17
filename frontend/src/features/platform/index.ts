import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** Public surface of the platform feature (Workus platform admins). */
export const CompaniesPage = lazyWithPreload(async () => ({
    default: (await import('./pages/companies-page')).CompaniesPage,
}));
export const CompanyPage = lazyWithPreload(async () => ({
    default: (await import('./pages/company-page')).CompanyPage,
}));
