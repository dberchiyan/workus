import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** The feature's route pages (lazy); in their own module so links inside the feature can preload them. */
export const EmployeesPage = lazyWithPreload(async () => ({
    default: (await import('./pages/employees-page')).EmployeesPage,
}));
export const EmployeeProfilePage = lazyWithPreload(async () => ({
    default: (await import('./pages/employee-profile-page')).EmployeeProfilePage,
}));
