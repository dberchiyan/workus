import type {
  CreateEmployeeCommand,
  TerminateEmployeeCommand,
  UpdateEmployeeCommand,
} from '../../core/service/employee.types';

export type { TerminateEmployeeCommand, UpdateEmployeeCommand };

export type HireEmployeeCommand = CreateEmployeeCommand & {
  /** Validated decimal string, USD per month. */
  startingSalary: string;
};

export interface HiredEmployee {
  id: string;
  firstName: string;
  lastName: string;
}
