import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma.service';

/**
 * The only place ownership rules are written (security.md → Authorisation). Existence checks
 * only — returns booleans, never throws, never returns data. Every check starts the chain at the
 * caller's organisation, so an id of another tenant never passes.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** A company of the platform (an organisation that is not the platform's own). */
  async isCompany(organisationId: string): Promise<boolean> {
    const count = await this.prisma.organisation.count({
      where: { id: organisationId, isPlatform: false },
    });
    return count > 0;
  }

  /** The employee belongs to the organisation. */
  async isOrganisationEmployee(organisationId: string, employeeId: string): Promise<boolean> {
    const count = await this.prisma.employee.count({ where: { id: employeeId, organisationId } });
    return count > 0;
  }

  /** The user (account) belongs to the organisation. */
  async isOrganisationUser(organisationId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id: userId, organisationId } });
    return count > 0;
  }

  /** The holiday belongs to the organisation. */
  async isOrganisationHoliday(organisationId: string, holidayId: string): Promise<boolean> {
    const count = await this.prisma.companyHoliday.count({
      where: { id: holidayId, organisationId },
    });
    return count > 0;
  }

  /** The time-off request belongs to the organisation. */
  async isOrganisationTimeOffRequest(organisationId: string, requestId: string): Promise<boolean> {
    const count = await this.prisma.timeOffRequest.count({
      where: { id: requestId, organisationId },
    });
    return count > 0;
  }

  /** The request belongs to the employee record of this user, in the organisation. */
  async isOwnTimeOffRequest(
    organisationId: string,
    userId: string,
    requestId: string,
  ): Promise<boolean> {
    const count = await this.prisma.timeOffRequest.count({
      where: { id: requestId, organisationId, employee: { userId } },
    });
    return count > 0;
  }

  /** The notification is addressed to the user, in the organisation. */
  async isOwnNotification(
    organisationId: string,
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: { id: notificationId, organisationId, recipientUserId: userId },
    });
    return count > 0;
  }

  /** The session is the user's own (sessions belong to a user, who belongs to one tenant). */
  async isOwnSession(userId: string, sessionId: string): Promise<boolean> {
    const count = await this.prisma.session.count({ where: { id: sessionId, userId } });
    return count > 0;
  }

  /** The user wrote this comment, and it is on this request of the organisation (whole chain). */
  async isTimeOffCommentAuthor(
    organisationId: string,
    userId: string,
    requestId: string,
    commentId: string,
  ): Promise<boolean> {
    const count = await this.prisma.timeOffRequestComment.count({
      where: { id: commentId, organisationId, requestId, authorId: userId },
    });
    return count > 0;
  }

  /** The user is one of the request's responsible people (set when made; admins may change them). */
  async isTimeOffRequestResponsible(
    organisationId: string,
    userId: string,
    requestId: string,
  ): Promise<boolean> {
    const count = await this.prisma.timeOffRequestResponsible.count({
      where: { organisationId, requestId, responsibleUserId: userId },
    });
    return count > 0;
  }

  /** The whole chain: the review belongs to the employee in the path, in the organisation. */
  async hasAccessToReview(
    organisationId: string,
    employeeId: string,
    reviewId: string,
  ): Promise<boolean> {
    const count = await this.prisma.employeeReview.count({
      where: { id: reviewId, organisationId, employeeId },
    });
    return count > 0;
  }
}
