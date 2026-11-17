import type { CalendarQuery } from '../api/calendar-api';
import type { ManagedRequestsQuery } from '../api/managed-requests-api';

export const timeOffKeys = {
    all: ['time-off'] as const,
    ownBalances: (): readonly ['time-off', 'own', 'balances'] => [...timeOffKeys.all, 'own', 'balances'] as const,
    ownRequests: (): readonly ['time-off', 'own', 'requests'] => [...timeOffKeys.all, 'own', 'requests'] as const,
    ownRequestsSince: (changedSince: string): readonly ['time-off', 'own', 'requests', string] =>
        [...timeOffKeys.ownRequests(), changedSince] as const,
    employeeBalances: (employeeId: string): readonly ['time-off', 'employee', string, 'balances'] =>
        [...timeOffKeys.all, 'employee', employeeId, 'balances'] as const,
    /** Every employee's requests (admin). */
    managed: (): readonly ['time-off', 'managed'] => [...timeOffKeys.all, 'managed'] as const,
    managedLists: (): readonly ['time-off', 'managed', 'list'] => [...timeOffKeys.managed(), 'list'] as const,
    managedList: (query: ManagedRequestsQuery): readonly ['time-off', 'managed', 'list', ManagedRequestsQuery] =>
        [...timeOffKeys.managedLists(), query] as const,
    managedRequest: (requestId: string): readonly ['time-off', 'managed', 'request', string] =>
        [...timeOffKeys.managed(), 'request', requestId] as const,
    candidates: (search: string): readonly ['time-off', 'candidates', string] =>
        [...timeOffKeys.all, 'candidates', search] as const,
    /** Company holidays of one year. */
    holidays: (): readonly ['time-off', 'holidays'] => [...timeOffKeys.all, 'holidays'] as const,
    holidayYear: (year: number): readonly ['time-off', 'holidays', number] =>
        [...timeOffKeys.holidays(), year] as const,
    /** The company calendar (everyone's). */
    calendar: (query: CalendarQuery): readonly ['time-off', 'calendar', CalendarQuery] =>
        [...timeOffKeys.all, 'calendar', query] as const,
};
