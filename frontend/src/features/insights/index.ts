import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const InsightsPage = lazyWithPreload(async () => ({
    default: (await import('./pages/insights-page')).InsightsPage,
}));
