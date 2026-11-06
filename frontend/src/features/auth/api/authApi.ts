import { apiClient } from '@/shared/api/client';
import type { CurrentUser, LoginRequest } from '../types';

const BASE = '/api/v1/auth';

export const authApi = {
  login: async (request: LoginRequest): Promise<CurrentUser> =>
    (await apiClient.post<CurrentUser>(`${BASE}/login`, request)).data,
  logout: async (): Promise<void> => {
    await apiClient.post(`${BASE}/logout`);
  },
  me: async (): Promise<CurrentUser> => (await apiClient.get<CurrentUser>(`${BASE}/me`)).data,
};

export const AUTH_SESSION_ENDPOINTS: readonly string[] = [`${BASE}/me`, `${BASE}/login`];
