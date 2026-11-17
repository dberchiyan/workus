import type { EmployeeStatus } from '../employee-status';

export interface EmployeeCriteria {
    searchTerms: string[];
    status: EmployeeStatus;
    categoryId: string | undefined;
    positionId?: string | undefined;
    today: Date;
}

const MAX_SEARCH_TERMS = 5;

export const toSearchTerms = (search: string | undefined): string[] =>
    (search ?? '')
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0)
        .slice(0, MAX_SEARCH_TERMS);
