import { lazy } from 'react';

/** Public surface of the shell: the signed-in layout, menu and section placeholders. */
export { AppLayout } from './components/AppLayout';
export const SectionPlaceholderPage = lazy(() => import('./pages/SectionPlaceholderPage'));
