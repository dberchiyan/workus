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
  responsibleUserIds: string[];
}

export interface CreatedEmployee {
  employee: EmployeeListItemRecord;
  today: Date;
}

export interface EmployeeProfile {
  employee: EmployeeProfileRecord;
  today: Date;
}
