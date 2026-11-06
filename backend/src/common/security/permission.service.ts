import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma.service';

/**
 * The only place ownership rules are written (security.md → Authorisation). Existence checks
 * only — returns booleans, never throws, never returns data.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** The request belongs to the employee record of this user. */
  async isOwnTimeOffRequest(userId: string, requestId: string): Promise<boolean> {
    const count = await this.prisma.timeOffRequest.count({
      where: { id: requestId, employee: { userId } },
    });
    return count > 0;
  }

  /** The whole chain: the review belongs to the employee in the path. */
  async hasAccessToReview(employeeId: string, reviewId: string): Promise<boolean> {
    const count = await this.prisma.employeeReview.count({ where: { id: reviewId, employeeId } });
    return count > 0;
  }
}
