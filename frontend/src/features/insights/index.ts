/** Public surface of the insights feature. */
import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

export const InsightsPage = lazyWithPreload(() => import('./pages/InsightsPage'));
