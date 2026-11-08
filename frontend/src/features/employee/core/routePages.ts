import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

/** The feature's route pages (lazy); in their own module so links inside the feature can preload them. */
export const EmployeesPage = lazyWithPreload(() => import('./pages/EmployeesPage'));
export const EmployeeProfilePage = lazyWithPreload(() => import('./pages/EmployeeProfilePage'));
