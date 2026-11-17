import type { AdministratorRole } from './types';

export const NEXT_ROLE: Record<AdministratorRole, AdministratorRole> = {
    OWNER: 'ADMIN',
    ADMIN: 'OWNER',
};

export const ROLE_BADGE: Record<AdministratorRole, string> = {
    OWNER: 'bg-badge-active-background text-badge-active-text',
    ADMIN: 'bg-badge-neutral-background text-text-secondary',
};
