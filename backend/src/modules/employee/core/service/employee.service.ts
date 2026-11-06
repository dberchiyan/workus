import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessConflictException,
  BusinessRuleException,
  ResourceNotFoundException,
} from '../../../../common/exception/api.exception';
import { AuditAction, AuditTargetType } from '../../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../../audit/service/audit-change';
import { AuditService } from '../../../audit/service/audit.service';
import type { AuditEventPage } from '../../../audit/service/audit.types';
import type { AuditEventSortField } from '../../../audit/service/audit-sort';
import { UserService } from '../../../user/service/user.service';
import { UserRole } from '../../../user/service/user-role';
import type { Pageable } from '../../../../common/dto/pageable';
import { EmployeeRepository } from '../repository/employee.repository';
import type { EmployeeListItemRecord } from '../repository/record/employee.record';
import { minusDays, todayUtc } from './calendar-date';
import type { EmployeeSortField } from './employee-sort';
import type { EmployeeStatus } from './employee-status';
import type {
  CreateEmployeeCommand,
  EmployeeProfile,
  EmployeePage,
  EmployeeSummary,
} from './employee.types';
import { toSearchTerms } from './filter/employee.criteria';

export interface EmployeeListQuery {
  search: string | undefined;
  status: EmployeeStatus;
  categoryId: string | undefined;
}

const NEW_HIRE_WINDOW_DAYS = 30;
const TERMINATION_WINDOW_DAYS = 90;

@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  async findPage(
    query: EmployeeListQuery,
    pageable: Pageable<EmployeeSortField>,
  ): Promise<EmployeePage> {
    const today = todayUtc();
    const page = await this.employeeRepository.findPage(
      {
        searchTerms: toSearchTerms(query.search),
        status: query.status,
        categoryId: query.categoryId,
        today,
      },
      pageable,
    );
    return { ...page, today };
  }

  /**
   * Active headcount, hires of the last 30 days, terminations of the last 90, mean tenure of
   * active employees and active employees nobody is responsible for.
   */
  async summary(): Promise<EmployeeSummary> {
    const today = todayUtc();
    const [
      totalActive,
      newLast30Days,
      terminatedLast90Days,
      averageTenureDays,
      withoutResponsible,
    ] = await Promise.all([
      this.employeeRepository.countActive(today),
      this.employeeRepository.countStartedBetween(minusDays(today, NEW_HIRE_WINDOW_DAYS), today),
      this.employeeRepository.countTerminatedBetween(
        minusDays(today, TERMINATION_WINDOW_DAYS),
        today,
      ),
      this.employeeRepository.averageTenureDays(today),
      this.employeeRepository.countActiveWithoutResponsible(today),
    ]);
    return {
      totalActive,
      newLast30Days,
      terminatedLast90Days,
      averageTenureDays: Math.round(averageTenureDays),
      withoutResponsible,
    };
  }

  /**
   * Creates the person's account (no password yet — set later via invitation) and their
   * employee record with responsibles, in one transaction. For the hiring module, which adds the
   * starting salary in the same transaction.
   */
  @Transactional()
  async create(command: CreateEmployeeCommand, actorId: string): Promise<EmployeeListItemRecord> {
    const today = todayUtc();
    const email = command.email.toLowerCase();
    if (await this.userService.existsByEmail(email)) {
      throw new BusinessConflictException('errors.employee.emailTaken', { email }, 'email');
    }
    if (!(await this.employeeRepository.positionExists(command.positionId))) {
      throw new BusinessRuleException('errors.employee.positionNotFound', {}, 'positionId');
    }
    const responsibleUserIds = [...new Set(command.responsibleUserIds)];
    if (
      responsibleUserIds.length > 0 &&
      (await this.employeeRepository.countResponsibleCandidates(responsibleUserIds, today)) !==
        responsibleUserIds.length
    ) {
      throw new BusinessRuleException(
        'errors.employee.responsibleNotFound',
        {},
        'responsibleUserIds',
      );
    }
    const userId = await this.userService.createWithoutPassword({
      email,
      firstName: command.firstName,
      lastName: command.lastName,
      role: UserRole.EMPLOYEE,
      createdBy: actorId,
    });
    const employeeId = await this.employeeRepository.create({
      userId,
      positionId: command.positionId,
      startDate: new Date(`${command.startDate}T00:00:00Z`),
      mobile: command.mobile,
      personalEmail: command.personalEmail?.toLowerCase(),
      linkedinUrl: command.linkedinUrl,
      telegram: command.telegram ? `@${command.telegram.replace(/^@/, '')}` : undefined,
      address: command.address,
      responsibleUserIds,
      createdBy: actorId,
    });
    const [employee, profile] = await Promise.all([
      this.employeeRepository.findListItemById(employeeId),
      this.employeeRepository.findProfileById(employeeId),
    ]);
    if (!employee || !profile) {
      throw new Error('Created employee not found in the same transaction');
    }
    await this.auditService.record({
      action: AuditAction.EMPLOYEE_CREATED,
      employeeId,
      target: {
        type: AuditTargetType.EMPLOYEE,
        id: employeeId,
        label: `${command.firstName} ${command.lastName}`,
      },
      // Contacts are personal data — the log names only the work facts.
      changes: [
        ...changeOf(AuditField.POSITION, null, auditValue.text(profile.position.title)),
        ...changeOf(AuditField.START_DATE, null, auditValue.date(profile.startDate)),
        ...(profile.responsibles.length > 0
          ? changeOf(
              AuditField.RESPONSIBLES,
              null,
              auditValue.people(
                profile.responsibles.map(({ responsible }) => ({
                  id: responsible.id,
                  firstName: responsible.firstName,
                  lastName: responsible.lastName,
                })),
              ),
            )
          : []),
      ],
    });
    return employee;
  }

  /** The employee's change history, newest first; 404 for an unknown employee. */
  async findActivity(
    employeeId: string,
    pageable: Pageable<AuditEventSortField>,
  ): Promise<AuditEventPage> {
    if (!(await this.employeeRepository.existsById(employeeId))) {
      throw new ResourceNotFoundException();
    }
    return this.auditService.findPageByEmployee(employeeId, pageable);
  }

  async findProfile(id: string): Promise<EmployeeProfile> {
    const employee = await this.employeeRepository.findProfileById(id);
    if (!employee) {
      throw new ResourceNotFoundException();
    }
    return { employee, today: todayUtc() };
  }

  /** For other modules: does the employee exist? */
  exists(id: string): Promise<boolean> {
    return this.employeeRepository.existsById(id);
  }

  /** For other modules: are all these users admins or active employees (possible responsibles)? */
  async areResponsibleCandidates(userIds: string[]): Promise<boolean> {
    const unique = [...new Set(userIds)];
    return (
      unique.length === 0 ||
      (await this.employeeRepository.countResponsibleCandidates(unique, todayUtc())) ===
        unique.length
    );
  }

  positionOptions() {
    return this.employeeRepository.findPositionOptions();
  }

  responsibleCandidates(search: string | undefined) {
    return this.employeeRepository.findResponsibleCandidates(toSearchTerms(search), todayUtc());
  }
}
