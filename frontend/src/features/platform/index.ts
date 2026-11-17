import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** Public surface of the platform feature (Workus platform admins). */
export const CompaniesPage = lazyWithPreload(() => import('./pages/companies-page'));
export const CompanyPage = lazyWithPreload(() => import('./pages/company-page'));
