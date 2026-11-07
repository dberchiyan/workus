import { apiClient } from '@/shared/api/client';
import type { ChangePasswordRequest, SecurityCategory, SecurityLog, UserSessions } from '../types';

/** Other sessions per page in Settings. */
export const SESSIONS_PAGE_SIZE = 5;
/** Security-log entries per "Show more" (grouped on screen, so a page shows fewer rows). */
export const SECURITY_LOG_PAGE_SIZE = 25;

const BASE = '/api/v1/auth';

/** The signed-in user's own account: password and sessions (Settings). */
export const accountApi = {
  /** Every session ends; this browser gets a new one (new cookies in the answer). */
  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    await apiClient.put(`${BASE}/password`, request);
  },
  sessions: async (page: number): Promise<UserSessions> =>
    (
      await apiClient.get<UserSessions>(`${BASE}/sessions`, {
        params: { page, size: SESSIONS_PAGE_SIZE },
      })
    ).data,
  /** Own security log, newest first. */
  securityLog: async (category: SecurityCategory | undefined, page: number): Promise<SecurityLog> =>
    (
      await apiClient.get<SecurityLog>(`${BASE}/security-log`, {
        params: { category, page, size: SECURITY_LOG_PAGE_SIZE },
      })
    ).data,
  endSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/sessions/${encodeURIComponent(sessionId)}`);
  },
  endOtherSessions: async (): Promise<void> => {
    await apiClient.delete(`${BASE}/sessions`);
  },
};
