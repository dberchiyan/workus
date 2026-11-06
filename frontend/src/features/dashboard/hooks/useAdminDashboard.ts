import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

/** No tenant: one company per installation. */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
};

export const useAdminDashboard = () =>
  useQuery({ queryKey: dashboardKeys.admin(), queryFn: dashboardApi.admin });
