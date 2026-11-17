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
    isAdmin(principal) && orNotFound(await permissions.isOrganisationEmployee(principal.organisationId, employeeId));

/** Admin, and the request in the path is of the caller's organisation. */
const adminOfRequest = async (
    principal: Principal,
    requestId: string,
    permissions: PermissionService,
): Promise<boolean> =>
    isAdmin(principal) &&
    orNotFound(await permissions.isOrganisationTimeOffRequest(principal.organisationId, requestId));

export const can = {
    ownAccount: policy([], () => true, 'account'),
    authenticated: policy([], () => true),
    platformAdmin: policy([], (principal) => principal.hasAuthority('PLATFORM_ADMIN'), 'platform'),
    manageCompany: policy(
        ['organisationId'],
        async (principal, args, permissions) =>
            principal.hasAuthority('PLATFORM_ADMIN') &&
            orNotFound(await permissions.isCompany(args.organisationId ?? '')),
        'platform',
    ),
    admin: policy([], isAdmin),
    renameSelf: policy([], isAdmin),
    owner: policy([], (principal) => principal.hasAuthority('OWNER')),
    manageBilling: policy([], (principal) => principal.hasAuthority('OWNER')),
    manageUserRole: policy(
        ['userId'],
        async (principal, args, permissions) =>
            principal.hasAuthority('OWNER') &&
            orNotFound(await permissions.isOrganisationUser(principal.organisationId, args.userId ?? '')),
    ),
    readOwnNotification: policy(['notificationId'], (principal, args, permissions) =>
        permissions.isOwnNotification(principal.organisationId, principal.userId, args.notificationId ?? ''),
    ),
    endOwnSession: policy(
        ['sessionId'],
        (principal, args, permissions) => permissions.isOwnSession(principal.userId, args.sessionId ?? ''),
        'account',
    ),
    viewInsights: policy([], isAdmin),
    viewHolidays: policy([], () => true),
    manageHolidays: policy([], isAdmin),
    manageHoliday: policy(
        ['holidayId'],
        async (principal, args, permissions) =>
            isAdmin(principal) &&
            orNotFound(await permissions.isOrganisationHoliday(principal.organisationId, args.holidayId ?? '')),
    ),
    manageStructure: policy([], isAdmin),
    manageDepartment: policy(
        ['departmentId'],
        async (principal, args, permissions) =>
            isAdmin(principal) &&
            orNotFound(await permissions.isOrganisationDepartment(principal.organisationId, args.departmentId ?? '')),
    ),
    managePosition: policy(
        ['positionId'],
        async (principal, args, permissions) =>
            isAdmin(principal) &&
            orNotFound(await permissions.isOrganisationPosition(principal.organisationId, args.positionId ?? '')),
    ),
    viewEmployees: policy([], isAdmin),
    viewEmployee: policy(['employeeId'], (principal, args, permissions) =>
        adminOfEmployee(principal, args.employeeId ?? '', permissions),
    ),
    viewEmployeeActivity: policy(['employeeId'], (principal, args, permissions) =>
        adminOfEmployee(principal, args.employeeId ?? '', permissions),
    ),
    viewEmployeeReviews: policy(['employeeId'], (principal, args, permissions) =>
        adminOfEmployee(principal, args.employeeId ?? '', permissions),
    ),
    manageEmployeeReviews: policy(['employeeId'], (principal, args, permissions) =>
        adminOfEmployee(principal, args.employeeId ?? '', permissions),
    ),
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
    manageEmployees: policy([], isAdmin),
    manageEmployee: policy(['employeeId'], (principal, args, permissions) =>
        adminOfEmployee(principal, args.employeeId ?? '', permissions),
    ),
    commentOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
        permissions.isOwnTimeOffRequest(principal.organisationId, principal.userId, args.requestId ?? ''),
    ),
    editTimeOffComment: policy(['requestId', 'commentId'], (principal, args, permissions) =>
        permissions.isTimeOffCommentAuthor(
            principal.organisationId,
            principal.userId,
            args.requestId ?? '',
            args.commentId ?? '',
        ),
    ),
    cancelOwnTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
        permissions.isOwnTimeOffRequest(principal.organisationId, principal.userId, args.requestId ?? ''),
    ),
    viewTimeOffCalendar: policy([], () => true),
    viewTimeOffRequests: policy([], isAdmin),
    viewTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
        adminOfRequest(principal, args.requestId ?? '', permissions),
    ),
    manageTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
        adminOfRequest(principal, args.requestId ?? '', permissions),
    ),
    commentTimeOffRequest: policy(['requestId'], (principal, args, permissions) =>
        adminOfRequest(principal, args.requestId ?? '', permissions),
    ),
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
