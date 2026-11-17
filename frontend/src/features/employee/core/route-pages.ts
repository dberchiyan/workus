import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const EmployeesPage = lazyWithPreload(async () => ({
    default: (await import('./pages/employees-page')).EmployeesPage,
}));
export const EmployeeProfilePage = lazyWithPreload(async () => ({
    default: (await import('./pages/employee-profile-page')).EmployeeProfilePage,
}));
