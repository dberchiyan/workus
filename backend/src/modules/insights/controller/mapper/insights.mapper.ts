import { toMoney } from '../../../../common/persistence/money';
import type { Absence, Headcount, Salary, Tenure, Turnover } from '../../service/insights.types';
import type {
  AbsenceResponse,
  HeadcountResponse,
  SalaryResponse,
  TenureResponse,
  TurnoverResponse,
} from '../dto/insights.response';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const toHeadcountResponse = (headcount: Headcount): HeadcountResponse => headcount;

export const toTenureResponse = (tenure: Tenure): TenureResponse => tenure;

export const toTurnoverResponse = (turnover: Turnover): TurnoverResponse => ({
  ...turnover,
  months: turnover.months.map((month) => ({
    month: month.month,
    hired: month.hired.map((person) => ({ ...person, date: isoDate(person.date) })),
    left: month.left.map((person) => ({ ...person, date: isoDate(person.date) })),
  })),
});

export const toAbsenceResponse = (absence: Absence): AbsenceResponse => absence;

export const toSalaryResponse = (salary: Salary): SalaryResponse => ({
  average: salary.average ? toMoney(salary.average, salary.currency) : null,
  previousAverage: salary.previousAverage ? toMoney(salary.previousAverage, salary.currency) : null,
  groups: salary.groups.map((group) => ({
    id: group.id,
    name: group.name,
    average: toMoney(group.average, salary.currency),
    employees: group.employees,
  })),
});
