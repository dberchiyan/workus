import type { SecurityCategory } from '../types';

/**
 * No tenant id: a user belongs to one organisation (it comes from the session) and the cache is
 * cleared on sign-out, so one cache never holds two organisations' data.
 */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
  sessionsPage: (page: number) => [...authKeys.sessions(), page] as const,
  securityLog: (category: SecurityCategory | undefined) =>
    [...authKeys.all, 'security-log', category ?? 'ALL'] as const,
};
