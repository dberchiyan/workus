import type { Schemas } from '@/shared/types';

/** Every figure for the year, from one request. */
export type Insights = Schemas['InsightsResponse_Output'];
export type Headcount = Insights['headcount'];
export type Tenure = Insights['tenure'];
export type Turnover = Insights['turnover'];
export type TurnoverMovement = Turnover['months'][number]['hired'][number];
export type Absence = Insights['absence'];
export type Salary = Insights['salary'];
export type InsightPerson = Schemas['InsightPerson_Output'];
export type CategoryCounts = Schemas['PositionCategoryCountsResponse_Output'];

export interface InsightsFilter {
  year: number;
  /** One position category; absent → the whole company. */
  categoryId: string | undefined;
}
