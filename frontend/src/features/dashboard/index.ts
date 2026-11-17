import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const DashboardPage = lazyWithPreload(() => import('./pages/dashboard-page'));
