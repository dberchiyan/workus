/** Route paths — one module for the router and every link. */
export const PATHS = {
  login: '/login',
  signup: '/signup',
  dashboard: '/',
  employees: '/employees',
  employeeProfile: '/employees/:employeeId',
  requests: '/requests',
  calendar: '/calendar',
  insights: '/insights',
  settings: '/settings',
  settingsSection: '/settings/:section',
  platform: '/platform',
  platformCompany: '/platform/companies/:organisationId',
} as const;

/** `/requests?request=<id>` — the Requests page with one request open. */
export const requestPath = (requestId: string): string =>
  `${PATHS.requests}?request=${encodeURIComponent(requestId)}`;

/** `/employees/:employeeId` for one employee. */
export const employeeProfilePath = (employeeId: string): string =>
  PATHS.employeeProfile.replace(':employeeId', encodeURIComponent(employeeId));

/** `/settings/<section>` — one section of Settings. */
export const settingsPath = (section: string): string =>
  PATHS.settingsSection.replace(':section', encodeURIComponent(section));

/** `/platform/companies/:organisationId` — one company (platform admins). */
export const platformCompanyPath = (organisationId: string): string =>
  PATHS.platformCompany.replace(':organisationId', encodeURIComponent(organisationId));
