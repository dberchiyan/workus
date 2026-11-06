import type { EmployeeStatus } from '../employee-status';

/** Resolved list criteria — the repository turns it into a `where`. */
export interface EmployeeCriteria {
  /** Each term must match first name, last name or email. */
  searchTerms: string[];
  status: EmployeeStatus;
  categoryId: string | undefined;
  today: Date;
}

const MAX_SEARCH_TERMS = 5;

export const toSearchTerms = (search: string | undefined): string[] =>
  (search ?? '')
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .slice(0, MAX_SEARCH_TERMS);
