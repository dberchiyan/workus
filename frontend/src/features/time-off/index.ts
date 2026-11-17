/** Public surface of the time-off feature. */
import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const RequestsPage = lazyWithPreload(async () => ({
    default: (await import('./pages/requests-page')).RequestsPage,
}));
export const CalendarPage = lazyWithPreload(async () => ({
    default: (await import('./pages/calendar-page')).CalendarPage,
}));
export { EmployeeLeaveBalances } from './components/employee-leave-balances';
export { HolidaysSection } from './components/holidays-section';
export { ManagedRequestDialog } from './components/managed-request-dialog';
export { MyTimeOff } from './components/my-time-off';
export { TimeOffStatusChip, TimeOffTypeChip } from './components/time-off-chips';
export { formatPeriod as formatTimeOffPeriod } from './format';
export { isTimeOffStatus, isTimeOffType } from './types';
/** Each type's icon and colour — the same on every page that shows time off. */
export { TYPE_VISUALS as TIME_OFF_TYPE_VISUALS } from './components/time-off-visuals';
