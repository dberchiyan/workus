import type { EmployeeMovements } from '../../employee/core/service/employee.types';
import type { TimeOffOverview } from '../../time-off/service/time-off.types';

export interface AdminDashboard {
  today: Date;
  timeOff: TimeOffOverview;
  reviews: { upcoming: number; overdue: number };
  movements: EmployeeMovements;
}
