/** Public surface of the time-off feature. */
import { lazyWithPreload } from '@/shared/lib/lazy-with-preload';

export const RequestsPage = lazyWithPreload(() => import('./pages/requests-page'));
export const CalendarPage = lazyWithPreload(() => import('./pages/calendar-page'));
export { MyTimeOff } from './components/my-time-off';
export { ManagedRequestDialog } from './components/managed-request-dialog';
export { HolidaysSection } from './components/holidays-section';
export { EmployeeLeaveBalances } from './components/employee-leave-balances';
export { TimeOffStatusChip, TimeOffTypeChip } from './components/time-off-chips';
export { isTimeOffStatus, isTimeOffType } from './types';
export { formatPeriod as formatTimeOffPeriod } from './format';
/** Each type's icon and colour — the same on every page that shows time off. */
export { TYPE_VISUALS as TIME_OFF_TYPE_VISUALS } from './components/time-off-visuals';
