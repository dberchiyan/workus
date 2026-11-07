import type { CalendarQuery } from '../api/calendarApi';
import type { ManagedRequestsQuery } from '../api/managedRequestsApi';

/** No tenant id: the organisation comes from the session. "own" = the signed-in employee. */
export const timeOffKeys = {
  all: ['time-off'] as const,
  ownBalances: () => [...timeOffKeys.all, 'own', 'balances'] as const,
  ownRequests: () => [...timeOffKeys.all, 'own', 'requests'] as const,
  ownRequestsSince: (changedSince: string) => [...timeOffKeys.ownRequests(), changedSince] as const,
  employeeBalances: (employeeId: string) =>
    [...timeOffKeys.all, 'employee', employeeId, 'balances'] as const,
  /** Every employee's requests (admin). */
  managed: () => [...timeOffKeys.all, 'managed'] as const,
  managedLists: () => [...timeOffKeys.managed(), 'list'] as const,
  managedList: (query: ManagedRequestsQuery) => [...timeOffKeys.managedLists(), query] as const,
  managedRequest: (requestId: string) => [...timeOffKeys.managed(), 'request', requestId] as const,
  candidates: (search: string) => [...timeOffKeys.all, 'candidates', search] as const,
  /** Company holidays of one year. */
  holidays: () => [...timeOffKeys.all, 'holidays'] as const,
  holidayYear: (year: number) => [...timeOffKeys.holidays(), year] as const,
  /** The company calendar (everyone's). */
  calendar: (query: CalendarQuery) => [...timeOffKeys.all, 'calendar', query] as const,
};
