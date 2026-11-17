import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const LoginPage = lazyWithPreload(async () => ({ default: (await import('./pages/login-page')).LoginPage }));
export { ACCESS, type AccessPart, type UserRole } from './access';
export { SECURITY_LOG_PAGE_SIZE, SESSIONS_PAGE_SIZE } from './api/account-api';
export { AUTH_SESSION_ENDPOINTS } from './api/auth-api';
export { BrandLogo } from './components/brand-logo';
export { IdleSessionWarning } from './components/idle-session-warning';
export { PageShell } from './components/page-shell';
export { RequireAccess } from './components/require-access';
export { RequireAuth } from './components/require-auth';
export { SecurityLogView } from './components/security-log-view';
export { authKeys } from './hooks/query-keys';
export { useAccess } from './hooks/use-access';
export {
    useChangePassword,
    useEndOtherSessions,
    useEndSession,
    useOwnSecurityLog,
    useSessions,
    useUpdateOwnName,
} from './hooks/use-account';
export { useCurrentUser } from './hooks/use-current-user';
export type { LoginLocationState } from './hooks/use-login-redirect';
export { useLogout } from './hooks/use-logout';
export { type CompanyPlan, type UpgradeState, usePlan, useUpgrade } from './hooks/use-plan';
export { type Plan, PLAN_FOR_FEATURE, type PlanFeature } from './plan';
export { isSecurityCategory } from './security-log';
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
export { describeUserAgent } from './user-agent';
