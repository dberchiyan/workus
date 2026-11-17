import type {
    CreateEmployeeCommand,
    TerminateEmployeeCommand,
    UpdateEmployeeCommand,
} from '../../core/service/employee.types';

export type { TerminateEmployeeCommand, UpdateEmployeeCommand };

export type HireEmployeeCommand = CreateEmployeeCommand & {
    startingSalary: string;
};

export interface HiredEmployee {
    id: string;
    firstName: string;
    lastName: string;
    temporaryPassword: string;
}
