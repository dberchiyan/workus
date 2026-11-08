import type { CompanyRecord, CompanyUserRecord } from '../../repository/record/company.record';
import type { CompanyResponse, CompanyUserPageResponse } from '../dto/company.response';

type CompanyUser = CompanyUserPageResponse['content'][number];

const STATUSES = ['PENDING', 'ACTIVE', 'REJECTED'] as const;
const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const;

export const toCompanyResponse = (company: CompanyRecord): CompanyResponse => ({
  id: company.id,
  name: company.name,
  // Guarded by ck_organisations_status.
  status: STATUSES.find((status) => status === company.status) ?? 'PENDING',
  createdAt: company.createdAt.toISOString(),
  decidedAt: company.decidedAt?.toISOString() ?? null,
  decidedBy: company.decider
    ? { firstName: company.decider.firstName, lastName: company.decider.lastName }
    : null,
  rejectionReason: company.rejectionReason,
  owners: company.users.map((owner) => ({
    id: owner.id,
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: owner.email,
  })),
  adminCount: company._count.users,
  activeEmployeeCount: company._count.employees,
});

/** `today`: an employee terminated on or before it has left. */
export const toCompanyUser = (user: CompanyUserRecord, today: Date): CompanyUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  // Guarded by ck_users_role (a company never holds platform admins).
  role: ROLES.find((role) => role === user.role) ?? 'EMPLOYEE',
  status:
    user.employee?.terminatedOn && user.employee.terminatedOn <= today ? 'TERMINATED' : 'ACTIVE',
  createdAt: user.createdAt.toISOString(),
});
