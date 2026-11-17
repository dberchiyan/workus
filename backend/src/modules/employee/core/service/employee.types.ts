import type { EmployeeListItemRecord, EmployeeProfileRecord } from '../repository/record/employee.record';

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
    startsAt: string;
    mobile: string | undefined;
    personalEmail: string | undefined;
    linkedinUrl: string | undefined;
    telegram: string | undefined;
    address: string | undefined;
    bornAt: string | undefined;
    responsibleUserIds: string[];
}

export type UpdateEmployeeCommand = Omit<CreateEmployeeCommand, 'responsibleUserIds'> & {
    version: number;
};

export interface TerminateEmployeeCommand {
    terminatedAt: string;
    reason: string;
    comment: string | undefined;
    version: number;
}

export interface EmployeeProfile {
    employee: EmployeeProfileRecord;
    today: Date;
}

export interface EmployeeForTimeOff {
    id: string;
    startsAt: Date;
    terminatedAt: Date | null;
    responsibleUserIds: string[];
}

export interface EmployeeCalendarRow {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    positionTitle: string;
    startsAt: Date;
    terminatedAt: Date | null;
}

export interface EmployeeCalendarPage {
    content: EmployeeCalendarRow[];
    totalElements: number;
}

export interface EmployeeMovement {
    kind: 'JOINING' | 'LEAVING';
    movedAt: Date;
    employeeId: string;
    userId: string;
    firstName: string;
    lastName: string;
}

export interface EmployeeMovements {
    joining: number;
    leaving: number;
    next: EmployeeMovement | null;
}

export interface EmployeeBirthday {
    employeeId: string;
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

export interface RosterEmployee {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    startsAt: Date;
    terminatedAt: Date | null;
    position: { id: string; title: string };
    category: { id: string; name: string; sortOrder: number };
}
