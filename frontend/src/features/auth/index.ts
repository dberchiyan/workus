import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

/** Public surface of the auth feature. Pages are lazy so the router stays in the shell chunk. */
export const LoginPage = lazyWithPreload(() => import('./pages/login-page'));
export { RequireAuth } from './components/require-auth';
export { RequireAccess } from './components/require-access';
export { IdleSessionWarning } from './components/idle-session-warning';
export { useAccess } from './hooks/use-access';
export { ACCESS, type AccessPart, type UserRole } from './access';
export { useLogout } from './hooks/use-logout';
export { useCurrentUser } from './hooks/use-current-user';
export { usePlan, useUpgrade, type CompanyPlan, type UpgradeState } from './hooks/use-plan';
export { PLAN_FOR_FEATURE, type Plan, type PlanFeature } from './plan';
export { authKeys } from './hooks/query-keys';
export { PageShell } from './components/page-shell';
export { BrandLogo } from './components/brand-logo';
export {
    useChangePassword,
    useEndOtherSessions,
    useEndSession,
    useOwnSecurityLog,
    useSessions,
    useUpdateOwnName,
} from './hooks/use-account';
export { SecurityLogView } from './components/security-log-view';
export { isSecurityCategory } from './security-log';
export { describeUserAgent } from './user-agent';
export { AUTH_SESSION_ENDPOINTS } from './api/auth-api';
export type {
    ChangePasswordRequest,
    CurrentUser,
    SecurityCategory,
    SecurityEvent,
    SecurityLog,
    UpdateOwnNameRequest,
    UserSession,
    UserSessions,
} from './types';
export { SECURITY_LOG_PAGE_SIZE, SESSIONS_PAGE_SIZE } from './api/account-api';
export type { LoginLocationState } from './hooks/use-login-redirect';
