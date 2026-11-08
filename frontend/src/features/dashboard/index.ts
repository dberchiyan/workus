import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

export const DashboardPage = lazyWithPreload(() => import('./pages/DashboardPage'));
