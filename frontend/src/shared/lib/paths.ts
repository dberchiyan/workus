/** Route paths — one module for the router and every link. */
export const PATHS = {
  login: '/login',
  dashboard: '/',
  employees: '/employees',
  employeeProfile: '/employees/:employeeId',
  timeOff: '/time-off',
  calendar: '/calendar',
  insights: '/insights',
  settings: '/settings',
} as const;

/** `/employees/:employeeId` for one employee. */
export const employeeProfilePath = (employeeId: string): string =>
  PATHS.employeeProfile.replace(':employeeId', encodeURIComponent(employeeId));
