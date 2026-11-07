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

/** Requests made in one day are few; bounded defensively. */
const MAX_REQUESTS = 100;

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

  async adminDashboard(): Promise<AdminDashboard> {
    const today = todayUtc();
    const [timeOff, reviews, movements] = await Promise.all([
      this.timeOffService.overview(today),
      this.reviewService.dueSummary(today, WINDOW_DAYS),
      this.employeeService.movements(today, WINDOW_DAYS),
    ]);
    return { today, timeOff, reviews, movements };
  }

  /** Requests made between `from` and `to` (today, UTC), newest first. */
  requestsMadeBetween(from: string, to: string): Promise<DashboardRequests> {
    return this.timeOffService.requestsCreatedBetween(new Date(from), new Date(to), MAX_REQUESTS);
  }

  /** Scheduled and completed reviews dated in [from, to], a page at a time. */
  reviews(
    range: { from: string; to: string },
    page: { page: number; size: number },
  ): Promise<DashboardReviews> {
    return this.reviewService.reviewsBetween(asDate(range.from), asDate(range.to), page);
  }

  /** Birthdays in [from, to] (one month) of people employed then, a page at a time. */
  birthdays(
    range: { from: string; to: string },
    page: { page: number; size: number },
  ): Promise<EmployeeBirthdays> {
    return this.employeeService.birthdays({ from: asDate(range.from), to: asDate(range.to) }, page);
  }
}
