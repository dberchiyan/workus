import { useCallback } from 'react';
import { type AccessPart, canAccess } from '../access';
import { useCurrentUser } from './useCurrentUser';

/** `can('section.insights')` for the signed-in user — see `ACCESS` (and the demo's limits). */
export const useAccess = (): ((part: AccessPart) => boolean) => {
  const user = useCurrentUser().data;
  const role = user?.role;
  const demoMode = user?.demoMode ?? false;
  return useCallback((part: AccessPart) => canAccess(role, part, demoMode), [role, demoMode]);
};

/** The public demo: some account actions are off (see `DEMO_RESTRICTED`). */
export const useDemoMode = (): boolean => useCurrentUser().data?.demoMode ?? false;
