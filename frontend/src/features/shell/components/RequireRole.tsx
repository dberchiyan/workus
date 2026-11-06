import { Navigate, Outlet } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { PATHS } from '@/shared/lib/paths';
import type { UserRole } from '../navigation';

export interface RequireRoleProps {
  roles: readonly UserRole[];
}

/** Cosmetic route guard — keeps users out of screens their role does not use; the API enforces. */
export function RequireRole({ roles }: RequireRoleProps) {
  const { data: user } = useCurrentUser();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={PATHS.dashboard} replace />;
  }
  return <Outlet />;
}
