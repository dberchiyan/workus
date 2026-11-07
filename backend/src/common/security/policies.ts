import { policy } from './policy';

/** Declared constants, never built inline. */
export const can = {
  /** Caller's own account only: /auth/me, /auth/logout. */
  authenticated: policy([], () => true),
  admin: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** One's own notifications only (the bell). */
  readOwnNotification: policy(['notificationId'], (principal, args, permissions) =>
    permissions.isOwnNotification(principal.userId, args.notificationId ?? ''),
  ),
  /** One's own sessions only (Settings → Sessions). */
  endOwnSession: policy(['sessionId'], (principal, args, permissions) =>
    permissions.isOwnSession(principal.userId, args.sessionId ?? ''),
  ),
  /** Company figures (headcount, tenure, turnover, absence, salaries) are an admin screen. */
  viewInsights: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** Company holidays: every signed-in user sees them (calendar, requesting time off). */
  viewHolidays: policy([], () => true),
  /** Keeping the holidays is an admin task (Settings → Holidays). */
  manageHolidays: policy([], (principal) => principal.hasAuthority('ADMIN')),
  /** One holiday: admin; no tenant, so the authority is the whole chain (404 for unknown ids). */
  manageHoliday: policy(['holidayId'], (principal) => principal.hasAuthority('ADMIN')),
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
  /** The employee comments on their own request. */
  commentOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    permissions.isOwnTimeOffRequest(principal.userId, args.requestId ?? ''),
  ),
  /** Only a comment's author (admin or employee) edits or deletes it. */
  editTimeOffComment: policy(['requestId', 'commentId'], (principal, args, permissions) =>
    permissions.isTimeOffCommentAuthor(
      principal.userId,
      args.requestId ?? '',
      args.commentId ?? '',
    ),
  ),
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
  /** Who decides a pending request: any admin may change it (so no request is left undecidable). */
  manageTimeOffRequest: policy(['requestId'], (principal) => principal.hasAuthority('ADMIN')),
  commentTimeOffRequest: policy(['requestId'], (principal) => principal.hasAuthority('ADMIN')),
  /** Approve, reject, cancel: an admin who is one of the request's responsible people. */
  decideTimeOffRequest: policy(
    ['requestId'],
    async (principal, args, permissions) =>
      principal.hasAuthority('ADMIN') &&
      (await permissions.isTimeOffRequestResponsible(principal.userId, args.requestId ?? '')),
  ),
} as const;
