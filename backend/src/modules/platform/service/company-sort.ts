export const COMPANY_SORT_FIELDS = ['createdAt', 'name'] as const;
export type CompanySortField = (typeof COMPANY_SORT_FIELDS)[number];

export const COMPANY_USER_SORT_FIELDS = ['name'] as const;
export type CompanyUserSortField = (typeof COMPANY_USER_SORT_FIELDS)[number];

/** The people tabs of a company: owners, admins, everyone else (employees and managers). */
export const COMPANY_PEOPLE = ['OWNER', 'ADMIN', 'EMPLOYEE'] as const;
export type CompanyPeople = (typeof COMPANY_PEOPLE)[number];
