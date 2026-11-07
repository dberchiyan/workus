import { ResourceNotFoundException } from '../exception/api.exception';
import type { PermissionService } from './permission.service';
import { policy } from './policy';
import type { Principal } from './principal';

/**
 * An id outside the caller's organisation answers exactly like an unknown id — 404 — so nobody
 * learns that it exists elsewhere. Only after the authority passed (no authority → 403).
 */
const orNotFound = (exists: boolean): true => {
  if (!exists) {
    throw new ResourceNotFoundException();
  }
  return true;
};

const isAdmin = (principal: Principal): boolean => principal.hasAuthority('ADMIN');

/** Admin, and the employee in the path is of the caller's organisation. */
const adminOfEmployee = async (
  principal: Principal,
  employeeId: string,
  permissions: PermissionService,
): Promise<boolean> =>
  isAdmin(principal) &&
  orNotFound(await permissions.isOrganisationEmployee(principal.organisationId, employeeId));

/** Admin, and the request in the path is of the caller's organisation. */
const adminOfRequest = async (
  principal: Principal,
  requestId: string,
  permissions: PermissionService,
): Promise<boolean> =>
  isAdmin(principal) &&
  orNotFound(await permissions.isOrganisationTimeOffRequest(principal.organisationId, requestId));

/** Declared constants, never built inline. Owners hold the ADMIN authority too. */
export const can = {
  /** Caller's own account only: /auth/me, /auth/logout. */
  authenticated: policy([], () => true),
  admin: policy([], isAdmin),
  /** The organisation's settings and people's roles. */
  owner: policy([], (principal) => principal.hasAuthority('OWNER')),
  /** Change one person's role: an owner, for a user of their organisation. */
  manageUserRole: policy(
    ['userId'],
    async (principal, args, permissions) =>
      principal.hasAuthority('OWNER') &&
      orNotFound(await permissions.isOrganisationUser(principal.organisationId, args.userId ?? '')),
  ),
  /** One's own notifications only (the bell). */
  readOwnNotification: policy(['notificationId'], (principal, args, permissions) =>
    permissions.isOwnNotification(
      principal.organisationId,
      principal.userId,
      args.notificationId ?? '',
    ),
  ),
  /** One's own sessions only (Settings → Sessions). */
  endOwnSession: policy(['sessionId'], (principal, args, permissions) =>
    permissions.isOwnSession(principal.userId, args.sessionId ?? ''),
  ),
  /** Company figures (headcount, tenure, turnover, absence, salaries) are an admin screen. */
  viewInsights: policy([], isAdmin),
  /** Company holidays: every signed-in user sees them (calendar, requesting time off). */
  viewHolidays: policy([], () => true),
  /** Keeping the holidays is an admin task (Settings → Holidays). */
  manageHolidays: policy([], isAdmin),
  /** One holiday: admin, and the holiday is of the caller's organisation. */
  manageHoliday: policy(
    ['holidayId'],
    async (principal, args, permissions) =>
      isAdmin(principal) &&
      orNotFound(
        await permissions.isOrganisationHoliday(principal.organisationId, args.holidayId ?? ''),
      ),
  ),
  /** The employee directory is an admin screen. */
  viewEmployees: policy([], isAdmin),
  /** One employee's profile: admin, for an employee of the caller's organisation. */
  viewEmployee: policy(['employeeId'], (principal, args, permissions) =>
    adminOfEmployee(principal, args.employeeId ?? '', permissions),
  ),
  /** The employee's change history (shows salaries): admin only. */
  viewEmployeeActivity: policy(['employeeId'], (principal, args, permissions) =>
    adminOfEmployee(principal, args.employeeId ?? '', permissions),
  ),
  /** Reviews hold salaries: admin only, for the employee in the path. */
  viewEmployeeReviews: policy(['employeeId'], (principal, args, permissions) =>
    adminOfEmployee(principal, args.employeeId ?? '', permissions),
  ),
  manageEmployeeReviews: policy(['employeeId'], (principal, args, permissions) =>
    adminOfEmployee(principal, args.employeeId ?? '', permissions),
  ),
  /** One review: admin, and the review belongs to the employee in the path (whole chain). */
  accessEmployeeReview: policy(
    ['employeeId', 'reviewId'],
    async (principal, args, permissions) =>
      isAdmin(principal) &&
      orNotFound(
        await permissions.hasAccessToReview(
          principal.organisationId,
          args.employeeId ?? '',
          args.reviewId ?? '',
        ),
      ),
  ),
  /** Adding employees (and their accounts) is an admin action. */
  manageEmployees: policy([], isAdmin),
  /** Edit one employee (e.g. their responsible people): admin, for the employee in the path. */
  manageEmployee: policy(['employeeId'], (principal, args, permissions) =>
    adminOfEmployee(principal, args.employeeId ?? '', permissions),
  ),
  /** The employee comments on their own request. */
  commentOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    permissions.isOwnTimeOffRequest(
      principal.organisationId,
      principal.userId,
      args.requestId ?? '',
    ),
  ),
  /** Only a comment's author (admin or employee) edits or deletes it. */
  editTimeOffComment: policy(['requestId', 'commentId'], (principal, args, permissions) =>
    permissions.isTimeOffCommentAuthor(
      principal.organisationId,
      principal.userId,
      args.requestId ?? '',
      args.commentId ?? '',
    ),
  ),
  /** One time-off request: the caller's own (the request belongs to their employee record). */
  cancelOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    permissions.isOwnTimeOffRequest(
      principal.organisationId,
      principal.userId,
      args.requestId ?? '',
    ),
  ),
  /** Everyone's approved and pending time off, with types — any signed-in user (product decision). */
  viewTimeOffCalendar: policy([], () => true),
  /** Every employee's requests: an admin screen. */
  viewTimeOffRequests: policy([], isAdmin),
  /** One request: admin, for a request of the caller's organisation. */
  viewTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    adminOfRequest(principal, args.requestId ?? '', permissions),
  ),
  /** Who decides a pending request: any admin may change it (so no request is left undecidable). */
  manageTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    adminOfRequest(principal, args.requestId ?? '', permissions),
  ),
  /** Any admin may comment on a request. */
  commentTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
    adminOfRequest(principal, args.requestId ?? '', permissions),
  ),
  /** Approve, reject, cancel: an admin who is one of the request's responsible people. */
  decideTimeOffRequest: policy(
    ['requestId'],
    async (principal, args, permissions) =>
      isAdmin(principal) &&
      (await permissions.isTimeOffRequestResponsible(
        principal.organisationId,
        principal.userId,
        args.requestId ?? '',
      )),
  ),
} as const;
