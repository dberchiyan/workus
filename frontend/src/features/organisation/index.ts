import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const SignupPage = lazyWithPreload(async () => ({ default: (await import('./pages/signup-page')).SignupPage }));
export { AdministratorsSection } from './components/administrators-section';
export { OrganisationGate } from './components/organisation-gate';
export { OrganisationSection } from './components/organisation-section';
