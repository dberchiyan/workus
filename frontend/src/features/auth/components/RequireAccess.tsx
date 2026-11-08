import { Navigate, Outlet } from 'react-router';
import { PATHS } from '@/shared/lib/paths';
import type { AccessPart } from '../access';
import { useAccess } from '../hooks/useAccess';

export interface RequireAccessProps {
  part: AccessPart;
}

/**
 * Cosmetic route guard: a section the user's role does not use returns home — the Dashboard, or
 * Companies for platform admins.
 */
export function RequireAccess({ part }: RequireAccessProps) {
  const can = useAccess();
  if (can(part)) {
    return <Outlet />;
  }
  return <Navigate to={can('section.dashboard') ? PATHS.dashboard : PATHS.platform} replace />;
}
