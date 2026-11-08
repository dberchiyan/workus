/** Public surface of the time-off feature. */
import { lazyWithPreload } from '@/shared/lib/lazyWithPreload';

export const RequestsPage = lazyWithPreload(() => import('./pages/RequestsPage'));
export const CalendarPage = lazyWithPreload(() => import('./pages/CalendarPage'));
export { MyTimeOff } from './components/MyTimeOff';
export { HolidaysSection } from './components/HolidaysSection';
export { EmployeeLeaveBalances } from './components/EmployeeLeaveBalances';
export { TimeOffStatusChip, TimeOffTypeChip } from './components/TimeOffChips';
export { isTimeOffStatus, isTimeOffType } from './types';
export { formatPeriod as formatTimeOffPeriod } from './format';
/** Each type's icon and colour — the same on every page that shows time off. */
export { TYPE_VISUALS as TIME_OFF_TYPE_VISUALS } from './components/timeOffVisuals';
