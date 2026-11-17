/** Public surface of the insights feature. */
import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const InsightsPage = lazyWithPreload(() => import('./pages/insights-page'));
