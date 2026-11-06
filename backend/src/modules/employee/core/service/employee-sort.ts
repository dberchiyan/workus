import { pageableOptions } from '../../../../common/dto/pageable';

export const EMPLOYEE_PAGEABLE = pageableOptions({
  sortable: ['name', 'startDate'] as const,
  defaultSort: 'name,asc',
});

export type EmployeeSortField = (typeof EMPLOYEE_PAGEABLE.sortable)[number];
