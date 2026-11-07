import { lazy } from 'react';

/** Public surface of the auth feature. Pages are lazy so the router stays in the shell chunk. */
export const LoginPage = lazy(() => import('./pages/LoginPage'));
export { RequireAuth } from './components/RequireAuth';
export { RequireAccess } from './components/RequireAccess';
export { useAccess } from './hooks/useAccess';
export { ACCESS, type AccessPart, type UserRole } from './access';
export { useLogout } from './hooks/useLogout';
export { useCurrentUser } from './hooks/useCurrentUser';
export { AUTH_SESSION_ENDPOINTS } from './api/authApi';
export type { CurrentUser } from './types';
export type { LoginLocationState } from './hooks/useLoginRedirect';
