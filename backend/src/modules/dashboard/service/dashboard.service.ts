import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../employee/core/service/employee.service';
import { ReviewService } from '../../employee/review/service/review.service';
import { TimeOffService } from '../../time-off/service/time-off.service';
import type { AdminDashboard } from './dashboard.types';

/** Reviews due and people starting / leaving: the next 30 days. */
const WINDOW_DAYS = 30;

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
}
