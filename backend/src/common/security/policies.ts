import { policy } from './policy';

/** Declared constants, never built inline. */
export const can = {
  /** Caller's own account only: /auth/me, /auth/logout. */
  authenticated: policy([], () => true),
  admin: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** Company figures (headcount, tenure, turnover, absence, salaries) are an admin screen. */
  viewInsights: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** The employee directory is an admin screen. */
  viewEmployees: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /**
   * One employee's profile. No tenant (one company per installation), so the whole chain is
   * the admin authority; the service answers 404 for an unknown id.
   */
  viewEmployee: policy(['employeeId'], (principal) => principal.hasAuthority('ADMIN')),
  /** The employee's change history (shows salaries): admin only. */
  viewEmployeeActivity: policy(['employeeId'], (principal) => principal.hasAuthority('ADMIN')),
  /** Reviews hold salaries: admin only, for the employee in the path. */
  viewEmployeeReviews: policy(['employeeId'], (principal) => principal.hasAuthority('ADMIN')),
  manageEmployeeReviews: policy(['employeeId'], (principal) => principal.hasAuthority('ADMIN')),
  /** One review: admin, and the review belongs to the employee in the path (whole chain). */
  accessEmployeeReview: policy(
    ['employeeId', 'reviewId'],
    async (principal, args, permissions) =>
      principal.hasAuthority('ADMIN') &&
      (await permissions.hasAccessToReview(args.employeeId ?? '', args.reviewId ?? '')),
  ),
  /** Adding employees (and their accounts) is an admin action. */
  manageEmployees: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** Edit one employee (e.g. their responsible people): admin, for the employee in the path. */
  manageEmployee: policy(['employeeId'], (principal) => principal.hasAuthority('ADMIN')),
  /** One time-off request: the caller's own (the request belongs to their employee record). */
  cancelOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    permissions.isOwnTimeOffRequest(principal.userId, args.requestId ?? ''),
  ),
  /** Every employee's requests: an admin screen. */
  /** Everyone's approved and pending time off, with types — any signed-in user (product decision). */
  viewTimeOffCalendar: policy([], () => true),
  viewTimeOffRequests: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** One request (no tenant): admin; the service answers 404 for an unknown id. */
  viewTimeOffRequest: policy(['requestId'], (principal) => principal.hasAuthority('ADMIN')),
  /** Any admin may comment on a request. */
  commentTimeOffRequest: policy(['requestId'], (principal) => principal.hasAuthority('ADMIN')),
  /** Approve, reject, cancel: an admin who is one of the request's responsible people. */
  decideTimeOffRequest: policy(
    ['requestId'],
    async (principal, args, permissions) =>
      principal.hasAuthority('ADMIN') &&
      (await permissions.isTimeOffRequestResponsible(principal.userId, args.requestId ?? '')),
  ),
} as const;
