import { lazy } from 'react';

/** Public surface of the organisation feature: registering a company and its settings. */
export const SignupPage = lazy(() => import('./pages/SignupPage'));
export { OrganisationSection } from './components/OrganisationSection';
export { AdministratorsSection } from './components/AdministratorsSection';
