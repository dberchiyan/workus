import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** Public surface of the organisation feature: registering a company and its settings. */
export const SignupPage = lazyWithPreload(() => import('./pages/signup-page'));
export { OrganisationSection } from './components/organisation-section';
export { AdministratorsSection } from './components/administrators-section';
export { OrganisationGate } from './components/organisation-gate';
