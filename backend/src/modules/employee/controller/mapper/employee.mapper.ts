import type {
  EmployeeListItemRecord,
  PositionOptionRecord,
  ResponsibleCandidateRecord,
} from '../../repository/record/employee.record';
import { toIsoDate } from '../../service/calendar-date';
import { statusOn } from '../../service/employee-status';
import type { EmployeePage } from '../../service/employee.types';
import { isUserRole } from '../../../user/service/user-role';
import type {
  PositionOptionsResponse,
  ResponsibleCandidatesResponse,
} from '../dto/employee-options.response';
import type { EmployeePageResponse } from '../dto/employee.response';

export const toEmployeeListItem = (employee: EmployeeListItemRecord, today: Date) => ({
  id: employee.id,
  userId: employee.user.id,
  firstName: employee.user.firstName,
  lastName: employee.user.lastName,
  email: employee.user.email,
  position: {
    id: employee.position.id,
    title: employee.position.title,
    category: { id: employee.position.category.id, name: employee.position.category.name },
  },
  responsibles: employee.responsibles.map(({ responsible }) => ({
    id: responsible.id,
    firstName: responsible.firstName,
    lastName: responsible.lastName,
  })),
  responsibleCount: employee._count.responsibles,
  startDate: toIsoDate(employee.startDate),
  terminatedOn: employee.terminatedOn ? toIsoDate(employee.terminatedOn) : null,
  status: statusOn(employee.terminatedOn, today),
});

export const toEmployeePageResponse = (page: EmployeePage): EmployeePageResponse => ({
  content: page.content.map((employee) => toEmployeeListItem(employee, page.today)),
  totalElements: page.totalElements,
});

export const toPositionOptionsResponse = (
  positions: PositionOptionRecord[],
): PositionOptionsResponse => ({
  content: positions.map((position) => ({
    id: position.id,
    title: position.title,
    category: { id: position.category.id, name: position.category.name },
  })),
});

export const toResponsibleCandidatesResponse = (
  users: ResponsibleCandidateRecord[],
): ResponsibleCandidatesResponse => ({
  content: users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: isUserRole(user.role) ? user.role : 'EMPLOYEE',
    positionTitle: user.employee?.position.title ?? null,
  })),
});
