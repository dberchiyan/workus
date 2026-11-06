import { apiClient } from '@/shared/api/client';
import type { AdminDashboard } from '../types';

export const dashboardApi = {
  admin: async (): Promise<AdminDashboard> =>
    (await apiClient.get<AdminDashboard>('/api/v1/dashboard/admin')).data,
};
