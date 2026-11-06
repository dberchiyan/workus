import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessConflictException,
  BusinessRuleException,
} from '../../../common/exception/api.exception';
import { UserService } from '../../user/service/user.service';
import { UserRole } from '../../user/service/user-role';
import type { Pageable } from '../../../common/dto/pageable';
import { EmployeeRepository } from '../repository/employee.repository';
import { minusDays, todayUtc } from './calendar-date';
import type { EmployeeSortField } from './employee-sort';
import type { EmployeeStatus } from './employee-status';
import type {
  CreatedEmployee,
  CreateEmployeeCommand,
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
   * employee record with responsibles, in one transaction.
   */
  @Transactional()
  async create(command: CreateEmployeeCommand, actorId: string): Promise<CreatedEmployee> {
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
    const employee = await this.employeeRepository.findListItemById(employeeId);
    if (!employee) {
      throw new Error('Created employee not found in the same transaction');
    }
    return { employee, today };
  }

  positionOptions() {
    return this.employeeRepository.findPositionOptions();
  }

  responsibleCandidates(search: string | undefined) {
    return this.employeeRepository.findResponsibleCandidates(toSearchTerms(search), todayUtc());
  }
}
