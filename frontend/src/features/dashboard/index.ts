import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const DashboardPage = lazyWithPreload(async () => ({
    default: (await import('./pages/dashboard-page')).DashboardPage,
}));
