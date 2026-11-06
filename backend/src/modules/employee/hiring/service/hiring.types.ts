import type { CreateEmployeeCommand } from '../../core/service/employee.types';

export type HireEmployeeCommand = CreateEmployeeCommand & {
  /** Validated decimal string, USD per month. */
  startingSalary: string;
};

export interface HiredEmployee {
  id: string;
  firstName: string;
  lastName: string;
}
