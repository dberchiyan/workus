/** Public surface of the time-off feature. */
import { lazy } from 'react';

export const RequestsPage = lazy(() => import('./pages/RequestsPage'));
export const CalendarPage = lazy(() => import('./pages/CalendarPage'));
export { MyTimeOff } from './components/MyTimeOff';
export { EmployeeLeaveBalances } from './components/EmployeeLeaveBalances';
export { TimeOffStatusChip, TimeOffTypeChip } from './components/TimeOffChips';
export { isTimeOffStatus, isTimeOffType } from './types';
