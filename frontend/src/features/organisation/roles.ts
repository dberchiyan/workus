import type { AdministratorRole } from './types';

/** The role a "change role" action gives: an admin becomes an owner, an owner an admin. */
export const NEXT_ROLE: Record<AdministratorRole, AdministratorRole> = {
  OWNER: 'ADMIN',
  ADMIN: 'OWNER',
};

/** Owners stand out in the list (active badge); admins are neutral. */
export const ROLE_BADGE: Record<AdministratorRole, string> = {
  OWNER: 'bg-badge-active-background text-badge-active-text',
  ADMIN: 'bg-badge-neutral-background text-text-secondary',
};
