import type { CurrentUser } from './types';

export type UserRole = CurrentUser['role'];

const EVERYONE = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const satisfies readonly UserRole[];
const PLATFORM = ['PLATFORM_ADMIN'] as const satisfies readonly UserRole[];
const ADMINS = ['OWNER', 'ADMIN'] as const satisfies readonly UserRole[];
const OWNERS = ['OWNER'] as const satisfies readonly UserRole[];

export const ACCESS = {
    'section.dashboard': EVERYONE,
    'section.employees': ADMINS,
    'section.requests': ADMINS,
    'section.calendar': EVERYONE,
    'section.insights': ADMINS,
    'section.settings': [...EVERYONE, ...PLATFORM],
    'section.companies': PLATFORM,
    'shell.notifications': EVERYONE,
    'dashboard.companyOverview': ADMINS,
    'dashboard.ownTimeOff': ['MANAGER', 'EMPLOYEE'],
    'calendar.openRequest': ADMINS,
    'calendar.openProfile': ADMINS,
    'settings.holidays': ADMINS,
    'settings.structure': ADMINS,
    'settings.organisation': OWNERS,
    'settings.billing': OWNERS,
    'billing.banner': OWNERS,
    'settings.administrators': ADMINS,
    'administrators.changeRole': OWNERS,
    'administrators.add': OWNERS,
    'account.editName': ADMINS,
    'account.changePassword': [...EVERYONE, ...PLATFORM],
    'account.endSessions': [...EVERYONE, ...PLATFORM],
    'employee.resetPassword': ADMINS,
} as const satisfies Record<string, readonly UserRole[]>;

export type AccessPart = keyof typeof ACCESS;

const DEMO_RESTRICTED: ReadonlySet<AccessPart> = new Set<AccessPart>([
    'account.changePassword',
    'account.endSessions',
    'employee.resetPassword',
    'administrators.changeRole',
]);

/** Does this role use that part (and is it open to a demo showcase account)? No user → no. */
export const canAccess = (role: UserRole | undefined, part: AccessPart, isDemoRestricted = false): boolean =>
    role !== undefined &&
    (ACCESS[part] as readonly UserRole[]).includes(role) &&
    !(isDemoRestricted && DEMO_RESTRICTED.has(part));
