import { Injectable } from '@nestjs/common';
import { Currency, type Decimal, roundToCents, toDecimal } from '../../../common/persistence/money';
import type { RosterEmployee } from '../../employee/core/service/employee.types';
import { EmployeeService } from '../../employee/core/service/employee.service';
import { ReviewService } from '../../employee/review/service/review.service';
import { TIME_OFF_TYPES, type TimeOffType } from '../../time-off/service/time-off-type';
import { TimeOffService } from '../../time-off/service/time-off.service';
import type {
  Absence,
  AbsenceLeader,
  Headcount,
  InsightGroup,
  Insights,
  InsightPerson,
  Salary,
  SalaryGroup,
  Tenure,
  TenureFigure,
  Turnover,
  TurnoverMonth,
} from './insights.types';

export interface InsightFilter {
  year: number;
  /** One position category (its positions become the groups); absent → every category. */
  categoryId?: string | undefined;
}

const TOP_ABSENCES = 10;

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};
const monthEnd = (year: number, month: number): Date => new Date(Date.UTC(year, month, 0));
const earlier = (a: Date, b: Date): Date => (a < b ? a : b);

/** The day a year is measured on: its last day, or today while it lasts. */
const referenceDay = (year: number, today: Date): Date => earlier(monthEnd(year, 12), today);

const employedOn = (employee: RosterEmployee, day: Date): boolean =>
  employee.startDate <= day && (employee.terminatedOn === null || employee.terminatedOn > day);

/** Whole months from `start` to `end` (0 within the first month). */
const wholeMonths = (start: Date, end: Date): number => {
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  return Math.max(0, end.getUTCDate() < start.getUTCDate() ? months - 1 : months);
};

const positionGroup = (person: RosterEmployee): InsightGroup => ({
  id: person.position.id,
  name: person.position.title,
});

const oneDecimal = (value: number): number => Math.round(value * 10) / 10;

const personOf = (employee: RosterEmployee): InsightPerson => ({
  employeeId: employee.id,
  userId: employee.userId,
  firstName: employee.firstName,
  lastName: employee.lastName,
  positionTitle: employee.position.title,
});

const byName = (a: RosterEmployee, b: RosterEmployee): number =>
  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);

/** Company figures computed from the roster, reviews and approved time off; owns no data. */
@Injectable()
export class InsightsService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly reviewService: ReviewService,
    private readonly timeOffService: TimeOffService,
  ) {}

  /**
   * Every figure for the year in one go: the roster is read once; approved time off and salaries
   * (this year and last) are read in parallel.
   */
  async overview(filter: InsightFilter): Promise<Insights> {
    const today = todayUtc();
    const people = await this.people(filter);
    const [absence, salary] = await Promise.all([
      this.absence(filter, people, today),
      this.salary(filter, people, today),
    ]);
    return {
      headcount: this.headcount(filter, people, today),
      tenure: this.tenure(filter, people, today),
      turnover: this.turnover(filter, people, today),
      absence,
      salary,
    };
  }

  /** People employed at the end of each month (today for the current one), by group. */
  private headcount(filter: InsightFilter, people: RosterEmployee[], today: Date): Headcount {
    const groupOf = this.grouping(filter);
    const groups = this.groupsOf(people, groupOf);
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      if (new Date(Date.UTC(filter.year, index, 1)) > today) {
        return { month, counts: null };
      }
      const day = earlier(monthEnd(filter.year, month), today);
      const counts = groups.map(
        (group) =>
          people.filter((person) => groupOf(person).id === group.id && employedOn(person, day))
            .length,
      );
      return { month, counts };
    });
    const day = referenceDay(filter.year, today);
    const previousDay = monthEnd(filter.year - 1, 12);
    // Groups nobody belonged to all year add nothing to the chart.
    const used = groups.map((_, index) => months.some((month) => (month.counts?.[index] ?? 0) > 0));
    return {
      groups: groups.filter((_, index) => used[index]),
      months: months.map((month) => ({
        month: month.month,
        counts: month.counts?.filter((_, index) => used[index]) ?? null,
      })),
      current: people.filter((person) => employedOn(person, day)).length,
      previous: people.filter((person) => employedOn(person, previousDay)).length,
    };
  }

  /** Average whole months worked by the people employed at the end of the year. */
  private tenure(filter: InsightFilter, people: RosterEmployee[], today: Date): Tenure {
    const figure = (group: InsightGroup, members: RosterEmployee[], day: Date): TenureFigure => ({
      ...group,
      employees: members.length,
      averageMonths: Math.round(
        members.reduce((sum, person) => sum + wholeMonths(person.startDate, day), 0) /
          members.length,
      ),
    });
    const average = (day: Date): number | null => {
      const employed = people.filter((person) => employedOn(person, day));
      return employed.length === 0
        ? null
        : figure({ id: '', name: '' }, employed, day).averageMonths;
    };
    const day = referenceDay(filter.year, today);
    const employed = people.filter((person) => employedOn(person, day));
    const categories = this.groupsOf(employed, (person) => person.category);
    return {
      averageMonths: average(day),
      previousAverageMonths: average(monthEnd(filter.year - 1, 12)),
      groups: categories.map((category) => {
        const members = employed.filter((person) => person.category.id === category.id);
        const positions = this.groupsOf(members, positionGroup);
        return {
          ...figure(category, members, day),
          items: positions.map((position) =>
            figure(
              position,
              members.filter((person) => person.position.id === position.id),
              day,
            ),
          ),
        };
      }),
    };
  }

  /** Starts and leaves per month (up to today), and the share of people who left. */
  private turnover(filter: InsightFilter, people: RosterEmployee[], today: Date): Turnover {
    const inYear = (date: Date | null, year: number): date is Date =>
      date !== null && date.getUTCFullYear() === year && date <= today;
    const months: TurnoverMonth[] = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      hired: [],
      left: [],
    }));
    for (const person of [...people].sort(byName)) {
      if (inYear(person.startDate, filter.year)) {
        months[person.startDate.getUTCMonth()]?.hired.push({
          ...personOf(person),
          date: person.startDate,
        });
      }
      if (inYear(person.terminatedOn, filter.year)) {
        months[person.terminatedOn.getUTCMonth()]?.left.push({
          ...personOf(person),
          date: person.terminatedOn,
        });
      }
    }
    const rate = (year: number): number | null => {
      const left = people.filter((person) => inYear(person.terminatedOn, year)).length;
      const counts = Array.from({ length: 12 }, (_, index) => index)
        .filter((index) => new Date(Date.UTC(year, index, 1)) <= today)
        .map((index) => {
          const day = earlier(monthEnd(year, index + 1), today);
          return people.filter((person) => employedOn(person, day)).length;
        });
      const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
      return counts.length === 0 || average === 0 ? null : oneDecimal((left / average) * 100);
    };
    return {
      months,
      hiredTotal: months.reduce((sum, month) => sum + month.hired.length, 0),
      leftTotal: months.reduce((sum, month) => sum + month.left.length, 0),
      rate: rate(filter.year),
      previousRate: rate(filter.year - 1),
    };
  }

  /** Who took the most approved working days off this year (up to today), and the average. */
  private async absence(
    filter: InsightFilter,
    people: RosterEmployee[],
    today: Date,
  ): Promise<Absence> {
    const byId = new Map(people.map((person) => [person.id, person]));
    const tally = async (year: number) => {
      const day = referenceDay(year, today);
      const rows = await this.timeOffService.approvedDaysBetween(
        new Date(Date.UTC(year, 0, 1)),
        day,
      );
      const totals = new Map<string, Record<TimeOffType, number>>();
      for (const row of rows) {
        if (!byId.has(row.employeeId)) {
          continue;
        }
        const entry =
          totals.get(row.employeeId) ??
          (Object.fromEntries(TIME_OFF_TYPES.map((type) => [type, 0])) as Record<
            TimeOffType,
            number
          >);
        entry[row.type] += row.days;
        totals.set(row.employeeId, entry);
      }
      const employed = people.filter((person) => employedOn(person, day)).length;
      const all = [...totals.values()].reduce(
        (sum, entry) => sum + TIME_OFF_TYPES.reduce((days, type) => days + entry[type], 0),
        0,
      );
      return { totals, average: employed === 0 ? null : oneDecimal(all / employed) };
    };
    const [current, previous] = await Promise.all([tally(filter.year), tally(filter.year - 1)]);
    const top: AbsenceLeader[] = [...current.totals.entries()]
      .flatMap(([employeeId, byType]) => {
        const person = byId.get(employeeId);
        return person
          ? [
              {
                person: personOf(person),
                byType,
                days: TIME_OFF_TYPES.reduce((days, type) => days + byType[type], 0),
              },
            ]
          : [];
      })
      .sort(
        (a, b) =>
          b.days - a.days ||
          `${a.person.firstName} ${a.person.lastName}`.localeCompare(
            `${b.person.firstName} ${b.person.lastName}`,
          ),
      )
      .slice(0, TOP_ABSENCES);
    return { top, averageDays: current.average, previousAverageDays: previous.average };
  }

  /** Average monthly salary (latest completed review) of the people employed at the end of the year. */
  private async salary(
    filter: InsightFilter,
    people: RosterEmployee[],
    today: Date,
  ): Promise<Salary> {
    const groupOf = this.grouping(filter);
    const measure = async (day: Date) => {
      const salaries = new Map(
        (await this.reviewService.salariesAsOf(day))
          .filter((row) => row.currency === Currency.USD)
          .map((row) => [row.employeeId, row.amount]),
      );
      const paid = people.flatMap((person) => {
        const amount = salaries.get(person.id);
        return amount && employedOn(person, day) ? [{ person, amount }] : [];
      });
      return { paid, average: mean(paid.map((row) => row.amount)) };
    };
    const [current, previous] = await Promise.all([
      measure(referenceDay(filter.year, today)),
      measure(monthEnd(filter.year - 1, 12)),
    ]);
    const groups: SalaryGroup[] = this.groupsOf(
      current.paid.map((row) => row.person),
      groupOf,
    ).flatMap((group) => {
      const amounts = current.paid
        .filter((row) => groupOf(row.person).id === group.id)
        .map((row) => row.amount);
      const average = mean(amounts);
      return average ? [{ ...group, average, employees: amounts.length }] : [];
    });
    groups.sort((a, b) => b.average.comparedTo(a.average));
    return {
      currency: Currency.USD,
      average: current.average,
      previousAverage: previous.average,
      groups,
    };
  }

  private async people(filter: InsightFilter): Promise<RosterEmployee[]> {
    const roster = await this.employeeService.roster();
    return filter.categoryId
      ? roster.filter((person) => person.category.id === filter.categoryId)
      : roster;
  }

  /** Categories for the whole company; positions within one category. */
  private grouping(filter: InsightFilter): (person: RosterEmployee) => InsightGroup {
    return filter.categoryId ? positionGroup : (person) => person.category;
  }

  /** Distinct groups of these people: categories in their set order, positions by title. */
  private groupsOf(
    people: RosterEmployee[],
    groupOf: (person: RosterEmployee) => InsightGroup,
  ): InsightGroup[] {
    const seen = new Map<string, { group: InsightGroup; order: number }>();
    for (const person of people) {
      const group = groupOf(person);
      if (!seen.has(group.id)) {
        const order = group.id === person.category.id ? person.category.sortOrder : 0;
        seen.set(group.id, { group: { id: group.id, name: group.name }, order });
      }
    }
    return [...seen.values()]
      .sort((a, b) => a.order - b.order || a.group.name.localeCompare(b.group.name))
      .map((entry) => entry.group);
  }
}

/** Mean to the cent, ROUND_HALF_UP; null for none. */
const mean = (amounts: Decimal[]): Decimal | null =>
  amounts.length === 0
    ? null
    : roundToCents(
        amounts.reduce((sum, amount) => sum.plus(amount), toDecimal('0')).dividedBy(amounts.length),
      );
