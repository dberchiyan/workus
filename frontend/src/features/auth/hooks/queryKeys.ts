import type { SecurityCategory } from '../types';

/** No tenant: one company per installation, roles are global. */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
  sessionsPage: (page: number) => [...authKeys.sessions(), page] as const,
  securityLog: (category: SecurityCategory | undefined) =>
    [...authKeys.all, 'security-log', category ?? 'ALL'] as const,
};
