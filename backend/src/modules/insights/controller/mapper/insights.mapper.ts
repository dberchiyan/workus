import { toMoney } from '../../../../common/persistence/money';
import type { Insights, Salary, Turnover } from '../../service/insights.types';
import type { InsightsResponse } from '../dto/insights.response';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const toTurnover = (turnover: Turnover): InsightsResponse['turnover'] => ({
  ...turnover,
  months: turnover.months.map((month) => ({
    month: month.month,
    hired: month.hired.map((person) => ({ ...person, date: isoDate(person.date) })),
    left: month.left.map((person) => ({ ...person, date: isoDate(person.date) })),
  })),
});

const toSalary = (salary: Salary): InsightsResponse['salary'] => ({
  average: salary.average ? toMoney(salary.average, salary.currency) : null,
  previousAverage: salary.previousAverage ? toMoney(salary.previousAverage, salary.currency) : null,
  groups: salary.groups.map((group) => ({
    id: group.id,
    name: group.name,
    average: toMoney(group.average, salary.currency),
    employees: group.employees,
  })),
});

export const toInsightsResponse = (insights: Insights): InsightsResponse => ({
  headcount: insights.headcount,
  tenure: insights.tenure,
  turnover: toTurnover(insights.turnover),
  absence: insights.absence,
  salary: toSalary(insights.salary),
});
