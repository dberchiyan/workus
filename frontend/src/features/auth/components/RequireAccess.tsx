import { Navigate, Outlet } from 'react-router';
import { PATHS } from '@/shared/lib/paths';
import type { AccessPart } from '../access';
import { useAccess } from '../hooks/useAccess';

export interface RequireAccessProps {
  part: AccessPart;
}

/** Cosmetic route guard: a section the user's role does not use returns to the Dashboard. */
export function RequireAccess({ part }: RequireAccessProps) {
  const can = useAccess();
  return can(part) ? <Outlet /> : <Navigate to={PATHS.dashboard} replace />;
}
