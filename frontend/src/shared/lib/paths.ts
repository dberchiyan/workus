/** Route paths — one module for the router and every link. */
export const PATHS = {
  login: '/login',
  dashboard: '/',
  employees: '/employees',
  employeeProfile: '/employees/:employeeId',
  requests: '/requests',
  calendar: '/calendar',
  insights: '/insights',
  settings: '/settings',
} as const;

/** `/requests?request=<id>` — the Requests page with one request open. */
export const requestPath = (requestId: string): string =>
  `${PATHS.requests}?request=${encodeURIComponent(requestId)}`;

/** `/employees/:employeeId` for one employee. */
export const employeeProfilePath = (employeeId: string): string =>
  PATHS.employeeProfile.replace(':employeeId', encodeURIComponent(employeeId));
