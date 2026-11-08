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
export type CreatedEmployee = Schemas['HiredEmployeeResponse_Output'];
export type PasswordReset = Schemas['PasswordResetResponse_Output'];
export type PositionOption = Schemas['PositionOptionsResponse_Output']['content'][number];
export type ResponsibleCandidate =
  Schemas['ResponsibleCandidatesResponse_Output']['content'][number];

export type EmployeeProfile = Schemas['EmployeeProfileResponse_Output'];

/** A candidate as shown in the people picker. */
export type ResponsibleOption = ResponsibleCandidate & { subtitle: string };
export type UpdateResponsiblesRequest = Schemas['UpdateResponsiblesRequest'];
export type UpdateEmployeeRequest = Schemas['UpdateEmployeeRequest'];
export type TerminateEmployeeRequest = Schemas['TerminateEmployeeRequest'];
export type TerminationReason = Schemas['TerminationReason_Output'];

export type ActivityPage = Schemas['EmployeeActivityPageResponse_Output'];
export type ActivityEvent = ActivityPage['content'][number];
export type ActivityAction = ActivityEvent['action'];
export type ActivityChange = ActivityEvent['changes'][number];
export type ActivityValue = NonNullable<ActivityChange['from']>;
