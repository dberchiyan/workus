import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

/** Public surface of the platform feature (Workus platform admins). */
export const CompaniesPage = lazyWithPreload(() => import('./pages/CompaniesPage'));
export const CompanyPage = lazyWithPreload(() => import('./pages/CompanyPage'));
