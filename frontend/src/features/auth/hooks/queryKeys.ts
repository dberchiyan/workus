/** No tenant: one company per installation, roles are global. */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
  sessionsPage: (page: number) => [...authKeys.sessions(), page] as const,
  securityLog: (page: number) => [...authKeys.all, 'security-log', page] as const,
};
