import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../employee/core/service/employee.service';
import { ReviewService } from '../../employee/review/service/review.service';
import { TimeOffService } from '../../time-off/service/time-off.service';
import type { EmployeeBirthdays } from '../../employee/core/service/employee.types';
import type { DashboardReviews } from '../../employee/review/service/review.types';
import type { DashboardRequests } from '../../time-off/service/time-off.types';
import type { AdminDashboard } from './dashboard.types';

/** Reviews due and people starting / leaving: the next 30 days. */
const WINDOW_DAYS = 30;

const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** Composes other modules' figures; owns no data. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly timeOffService: TimeOffService,
    private readonly reviewService: ReviewService,
    private readonly employeeService: EmployeeService,
  ) {}

  async adminDashboard(organisationId: string): Promise<AdminDashboard> {
    const today = todayUtc();
    const [timeOff, reviews, movements] = await Promise.all([
      this.timeOffService.overview(organisationId, today),
      this.reviewService.dueSummary(organisationId, today, WINDOW_DAYS),
      this.employeeService.movements(organisationId, today, WINDOW_DAYS),
    ]);
    return { today, timeOff, reviews, movements };
  }

  /** Requests made between `from` and `to` (today, UTC), newest first, a page at a time. */
  requestsMadeBetween(
    organisationId: string,
    range: { from: string; to: string },
    page: { page: number; size: number },
  ): Promise<DashboardRequests> {
    return this.timeOffService.requestsCreatedBetween(
      organisationId,
      new Date(range.from),
      new Date(range.to),
      page,
    );
  }

  /** Scheduled and completed reviews dated in [from, to], a page at a time. */
  reviews(
    organisationId: string,
    range: { from: string; to: string },
    page: { page: number; size: number },
  ): Promise<DashboardReviews> {
    return this.reviewService.reviewsBetween(
      organisationId,
      asDate(range.from),
      asDate(range.to),
      page,
    );
  }

  /** Birthdays in [from, to] (one month) of people employed then, a page at a time. */
  birthdays(
    organisationId: string,
    range: { from: string; to: string },
    page: { page: number; size: number },
  ): Promise<EmployeeBirthdays> {
    return this.employeeService.birthdays(
      organisationId,
      { from: asDate(range.from), to: asDate(range.to) },
      page,
    );
  }
}
