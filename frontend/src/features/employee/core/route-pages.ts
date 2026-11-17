import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** The feature's route pages (lazy); in their own module so links inside the feature can preload them. */
export const EmployeesPage = lazyWithPreload(() => import('./pages/employees-page'));
export const EmployeeProfilePage = lazyWithPreload(() => import('./pages/employee-profile-page'));
