import { useCallback } from 'react';
import { type AccessPart, canAccess } from '../access';
import { useCurrentUser } from './useCurrentUser';

/** `can('section.insights')` for the signed-in user — see `ACCESS` (and the demo's limits). */
export const useAccess = (): ((part: AccessPart) => boolean) => {
  const user = useCurrentUser().data;
  const role = user?.role;
  const demoRestricted = user?.demoRestricted ?? false;
  return useCallback(
    (part: AccessPart) => canAccess(role, part, demoRestricted),
    [role, demoRestricted],
  );
};
