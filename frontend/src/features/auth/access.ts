import type { CurrentUser } from './types';

export type UserRole = CurrentUser['role'];

const EVERYONE = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const satisfies readonly UserRole[];
/** Owners can do everything admins can. */
const ADMINS = ['OWNER', 'ADMIN'] as const satisfies readonly UserRole[];
const OWNERS = ['OWNER'] as const satisfies readonly UserRole[];

/**
 * Which roles use which parts of the interface — the one place the UI decides by role. Hiding is
 * cosmetic: the API enforces every rule on its own. Add a part here and read it with
 * `useAccess()` / `<RequireAccess>`; never compare `user.role` in a component.
 */
export const ACCESS = {
  /** Menu sections (and their routes). */
  'section.dashboard': EVERYONE,
  'section.employees': ADMINS,
  'section.requests': ADMINS,
  'section.calendar': EVERYONE,
  'section.insights': ADMINS,
  'section.settings': EVERYONE,
  /** Dashboard: company figures and events vs one's own time off. */
  'dashboard.companyOverview': ADMINS,
  'dashboard.ownTimeOff': ['MANAGER', 'EMPLOYEE'],
  /** Calendar: a request opens on the Requests page, a name opens the profile. */
  'calendar.openRequest': ADMINS,
  'calendar.openProfile': ADMINS,
  /** Settings: the company holidays are kept by admins. */
  'settings.holidays': ADMINS,
  /** Settings: the organisation's name — owners. */
  'settings.organisation': OWNERS,
  /** Settings: who runs the organisation — admins see it, owners change roles. */
  'settings.administrators': ADMINS,
  'administrators.changeRole': OWNERS,
  'administrators.add': OWNERS,
} as const satisfies Record<string, readonly UserRole[]>;

export type AccessPart = keyof typeof ACCESS;

/** Does this role use that part? No user → no. */
export const canAccess = (role: UserRole | undefined, part: AccessPart): boolean =>
  role !== undefined && (ACCESS[part] as readonly UserRole[]).includes(role);
