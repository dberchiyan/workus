import { useCallback } from 'react';
import { type AccessPart, canAccess } from '../access';
import { useCurrentUser } from './useCurrentUser';

/** `can('section.insights')` for the signed-in user — see `ACCESS`. */
export const useAccess = (): ((part: AccessPart) => boolean) => {
  const role = useCurrentUser().data?.role;
  return useCallback((part: AccessPart) => canAccess(role, part), [role]);
};
