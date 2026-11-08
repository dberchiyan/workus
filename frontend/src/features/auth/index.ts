import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

/** Public surface of the auth feature. Pages are lazy so the router stays in the shell chunk. */
export const LoginPage = lazyWithPreload(() => import('./pages/LoginPage'));
export { RequireAuth } from './components/RequireAuth';
export { RequireAccess } from './components/RequireAccess';
export { IdleSessionWarning } from './components/IdleSessionWarning';
export { useAccess } from './hooks/useAccess';
export { ACCESS, type AccessPart, type UserRole } from './access';
export { useLogout } from './hooks/useLogout';
export { useCurrentUser } from './hooks/useCurrentUser';
export { authKeys } from './hooks/queryKeys';
export { PageShell } from './components/PageShell';
export { BrandLogo } from './components/BrandLogo';
export {
  useChangePassword,
  useEndOtherSessions,
  useEndSession,
  useOwnSecurityLog,
  useSessions,
} from './hooks/useAccount';
export { SecurityLogView } from './components/SecurityLogView';
export { isSecurityCategory, nextSecurityLogPage } from './securityLog';
export { describeUserAgent } from './userAgent';
export { AUTH_SESSION_ENDPOINTS } from './api/authApi';
export type {
  ChangePasswordRequest,
  CurrentUser,
  SecurityCategory,
  SecurityEvent,
  SecurityLog,
  UserSession,
  UserSessions,
} from './types';
export { SECURITY_LOG_PAGE_SIZE, SESSIONS_PAGE_SIZE } from './api/accountApi';
export type { LoginLocationState } from './hooks/useLoginRedirect';
