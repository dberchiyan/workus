/** Administrators are listed by name; the only sortable field. */
export const ADMINISTRATOR_SORT_FIELDS = ['name'] as const;
export type AdministratorSortField = (typeof ADMINISTRATOR_SORT_FIELDS)[number];
