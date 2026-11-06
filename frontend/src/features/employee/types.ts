import type { Schemas } from '@/shared/types';

export type EmployeeListItem = Schemas['EmployeeListItem_Output'];
export type EmployeePage = Schemas['EmployeePageResponse_Output'];
export type EmployeeSummary = Schemas['EmployeeSummaryResponse_Output'];
export type CategoryCounts = Schemas['PositionCategoryCountsResponse_Output'];
export type EmployeeStatus = Schemas['EmployeeStatus'];

export type EmployeeSortField = 'name' | 'startDate';
export type SortDirection = 'asc' | 'desc';

/** List state as it lives in the URL (page is 1-based there, 0-based in the API). */
export interface EmployeeListParams {
  categoryId: string | undefined;
  status: EmployeeStatus;
  search: string;
  page: number;
  size: number;
  sortField: EmployeeSortField;
  sortDirection: SortDirection;
}

export type EmployeeFilters = Pick<EmployeeListParams, 'status' | 'search'>;

export type CreateEmployeeRequest = Schemas['CreateEmployeeRequest'];
export type CreatedEmployee = Schemas['EmployeeListItemResponse_Output'];
export type PositionOption = Schemas['PositionOptionsResponse_Output']['content'][number];
export type ResponsibleCandidate =
  Schemas['ResponsibleCandidatesResponse_Output']['content'][number];
