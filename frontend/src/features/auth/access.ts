import type { CurrentUser } from './types';

export type UserRole = CurrentUser['role'];

/** Everyone in a company (platform admins are not: they never see tenant data). */
const EVERYONE = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const satisfies readonly UserRole[];
const PLATFORM = ['PLATFORM_ADMIN'] as const satisfies readonly UserRole[];
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
  'section.settings': [...EVERYONE, ...PLATFORM],
  /** Workus platform administration: companies and their approval. */
  'section.companies': PLATFORM,
  /** The bell: a company's notices. */
  'shell.notifications': EVERYONE,
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
  /** Settings → Account: one's own name — admins and owners (an employee's is their HR record). */
  'account.editName': ADMINS,
  /** Settings → Account / Sessions: one's own password and other sessions. */
  'account.changePassword': [...EVERYONE, ...PLATFORM],
  'account.endSessions': [...EVERYONE, ...PLATFORM],
  /** Employee profile: a new generated password. */
  'employee.resetPassword': ADMINS,
} as const satisfies Record<string, readonly UserRole[]>;

export type AccessPart = keyof typeof ACCESS;

/**
 * Turned off in the public demo (`demoMode` from the server, which refuses them too): each
 * would lock other visitors out of the shared accounts.
 */
const DEMO_RESTRICTED: ReadonlySet<AccessPart> = new Set<AccessPart>([
  'account.changePassword',
  'account.endSessions',
  'employee.resetPassword',
  'administrators.changeRole',
]);

/** Does this role use that part (and is it open in the demo)? No user → no. */
export const canAccess = (
  role: UserRole | undefined,
  part: AccessPart,
  demoMode = false,
): boolean =>
  role !== undefined &&
  (ACCESS[part] as readonly UserRole[]).includes(role) &&
  !(demoMode && DEMO_RESTRICTED.has(part));
