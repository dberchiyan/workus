import type { Schemas } from '@/shared/types';

export type Headcount = Schemas['HeadcountResponse_Output'];
export type Tenure = Schemas['TenureResponse_Output'];
export type Turnover = Schemas['TurnoverResponse_Output'];
export type TurnoverMovement = Turnover['months'][number]['hired'][number];
export type Absence = Schemas['AbsenceResponse_Output'];
export type Salary = Schemas['SalaryResponse_Output'];
export type InsightPerson = Schemas['InsightPerson_Output'];
export type CategoryCounts = Schemas['PositionCategoryCountsResponse_Output'];

export interface InsightsFilter {
  year: number;
  /** One position category; absent → the whole company. */
  categoryId: string | undefined;
}
