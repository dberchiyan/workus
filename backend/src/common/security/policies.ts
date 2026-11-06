import { policy } from './policy';

/** Declared constants, never built inline. */
export const can = {
  /** Caller's own account only: /auth/me, /auth/logout. */
  authenticated: policy([], () => true),
  admin: policy([], (principal) => principal.hasAuthority('ADMIN')),
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
} as const;
