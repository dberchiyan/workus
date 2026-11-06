import { isUserRole, type UserRole } from '../../../../user/service/user-role';
import type { EmployeeProfileRecord } from '../../repository/record/employee.record';
import { toIsoDate } from '../../service/calendar-date';
import { statusOn } from '../../service/employee-status';
import { isTerminationReason, TerminationReason } from '../../service/termination-reason';
import type { EmployeeProfileResponse } from '../dto/employee-profile.response';

/** Guarded by ck_users_role; falls back defensively. */
const roleOf = (role: string): UserRole => (isUserRole(role) ? role : 'EMPLOYEE');

export const toEmployeeProfileResponse = (
  employee: EmployeeProfileRecord,
  today: Date,
): EmployeeProfileResponse => ({
  id: employee.id,
  userId: employee.user.id,
  firstName: employee.user.firstName,
  lastName: employee.user.lastName,
  email: employee.user.email,
  role: roleOf(employee.user.role),
  position: {
    id: employee.position.id,
    title: employee.position.title,
    category: { id: employee.position.category.id, name: employee.position.category.name },
  },
  startDate: toIsoDate(employee.startDate),
  terminatedOn: employee.terminatedOn ? toIsoDate(employee.terminatedOn) : null,
  // Guarded by ck_employees_termination_reason and ck_employees_termination_reason_with_date.
  termination:
    employee.terminatedOn && employee.terminationReason
      ? {
          reason: isTerminationReason(employee.terminationReason)
            ? employee.terminationReason
            : TerminationReason.OTHER,
          comment: employee.terminationComment,
        }
      : null,
  status: statusOn(employee.terminatedOn, today),
  contacts: {
    mobile: employee.mobile,
    personalEmail: employee.personalEmail,
    linkedinUrl: employee.linkedinUrl,
    telegram: employee.telegram,
    address: employee.address,
  },
  responsibles: employee.responsibles.map(({ responsible }) => ({
    id: responsible.id,
    firstName: responsible.firstName,
    lastName: responsible.lastName,
    email: responsible.email,
    role: roleOf(responsible.role),
    positionTitle: responsible.employee?.position.title ?? null,
  })),
  createdAt: employee.createdAt.toISOString(),
  version: employee.version,
});
