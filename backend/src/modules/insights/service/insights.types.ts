import type { Decimal } from '../../../common/persistence/money';
import type { TimeOffType } from '../../time-off/service/time-off-type';

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
    months: { month: number; counts: number[] | null }[];
    current: number;
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
    hired: (InsightPerson & { movedAt: Date })[];
    left: (InsightPerson & { movedAt: Date })[];
}

export interface Turnover {
    months: TurnoverMonth[];
    hiredTotal: number;
    leftTotal: number;
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

export interface Insights {
    headcount: Headcount;
    tenure: Tenure;
    turnover: Turnover;
    absence: Absence;
    salary: Salary;
}
