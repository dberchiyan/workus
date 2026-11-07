import type { Decimal } from '../../../common/persistence/money';
import type { TimeOffType } from '../../time-off/service/time-off-type';

/** A slice of the company: a position category, or a position within one. */
export interface InsightGroup {
  id: string;
  name: string;
}

export interface InsightPerson {
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
}

export interface Headcount {
  groups: InsightGroup[];
  /** Twelve months; `counts` follow `groups`; null for months that have not started. */
  months: { month: number; counts: number[] | null }[];
  /** At the end of the year (or today, this year). */
  current: number;
  /** At the end of the previous year. */
  previous: number;
}

export interface TenureFigure {
  id: string;
  name: string;
  averageMonths: number;
  employees: number;
}

export interface Tenure {
  averageMonths: number | null;
  previousAverageMonths: number | null;
  groups: (TenureFigure & { items: TenureFigure[] })[];
}

export interface TurnoverMonth {
  month: number;
  hired: (InsightPerson & { date: Date })[];
  left: (InsightPerson & { date: Date })[];
}

export interface Turnover {
  months: TurnoverMonth[];
  hiredTotal: number;
  leftTotal: number;
  /** People who left ÷ average headcount × 100, one decimal; null without anyone employed. */
  rate: number | null;
  previousRate: number | null;
}

export interface AbsenceLeader {
  person: InsightPerson;
  days: number;
  byType: Record<TimeOffType, number>;
}

export interface Absence {
  top: AbsenceLeader[];
  /** Approved working days off per person employed at the end of the period, one decimal. */
  averageDays: number | null;
  previousAverageDays: number | null;
}

export interface SalaryGroup extends InsightGroup {
  average: Decimal;
  employees: number;
}

export interface Salary {
  currency: string;
  average: Decimal | null;
  previousAverage: Decimal | null;
  groups: SalaryGroup[];
}
