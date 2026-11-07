import type {
  EmployeeListItemRecord,
  EmployeeProfileRecord,
} from '../repository/record/employee.record';

export interface EmployeePage {
  content: EmployeeListItemRecord[];
  totalElements: number;
  today: Date;
}

export interface EmployeeSummary {
  totalActive: number;
  newLast30Days: number;
  terminatedLast90Days: number;
  averageTenureDays: number;
  withoutResponsible: number;
}

export interface CategoryCount {
  id: string;
  name: string;
  employeeCount: number;
}

export interface CategoryCounts {
  total: number;
  categories: CategoryCount[];
}

export interface CreateEmployeeCommand {
  firstName: string;
  lastName: string;
  email: string;
  positionId: string;
  startDate: string;
  mobile: string | undefined;
  personalEmail: string | undefined;
  linkedinUrl: string | undefined;
  telegram: string | undefined;
  address: string | undefined;
  /** `YYYY-MM-DD`. */
  dateOfBirth: string | undefined;
  responsibleUserIds: string[];
}

export type UpdateEmployeeCommand = Omit<CreateEmployeeCommand, 'responsibleUserIds'> & {
  version: number;
};

export interface TerminateEmployeeCommand {
  /** Last-day semantics as stored: terminated from this date (inclusive). */
  date: string;
  reason: string;
  comment: string | undefined;
  version: number;
}

export interface EmployeeProfile {
  employee: EmployeeProfileRecord;
  today: Date;
}

/** For time off: the employee's dates and responsible people (who decide requests). */
export interface EmployeeForTimeOff {
  id: string;
  startDate: Date;
  terminatedOn: Date | null;
  responsibleUserIds: string[];
}

/** One row of the time-off calendar (for other modules). */
export interface EmployeeCalendarRow {
  id: string;
  /** For the avatar colour. */
  userId: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
  startDate: Date;
  /** First day without work; null while employed. */
  terminatedOn: Date | null;
}

export interface EmployeeCalendarPage {
  content: EmployeeCalendarRow[];
  totalElements: number;
}

export interface EmployeeMovement {
  kind: 'JOINING' | 'LEAVING';
  date: Date;
  employeeId: string;
  /** For the avatar colour. */
  userId: string;
  firstName: string;
  lastName: string;
}

/** People starting and leaving within the window (dashboard). */
export interface EmployeeMovements {
  joining: number;
  leaving: number;
  /** The soonest start or leave, if any. */
  next: EmployeeMovement | null;
}

/** A birthday (no year — age is personal data) of someone employed then. */
export interface EmployeeBirthday {
  employeeId: string;
  /** For the avatar colour. */
  userId: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
  month: number;
  day: number;
}

export interface EmployeeBirthdays {
  content: EmployeeBirthday[];
  totalElements: number;
}
