import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessConflictException,
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../../common/exception/api.exception';
import { AuditAction, AuditTargetType } from '../../../audit/service/audit-action';
import {
  type AuditChange,
  AuditField,
  auditValue,
  changeOf,
} from '../../../audit/service/audit-change';
import { AuditService } from '../../../audit/service/audit.service';
import type { AuditEventPage } from '../../../audit/service/audit.types';
import type { AuditEventSortField } from '../../../audit/service/audit-sort';
import { UserService } from '../../../user/service/user.service';
import { UserRole } from '../../../user/service/user-role';
import type { Pageable } from '../../../../common/dto/pageable';
import { EmployeeRepository } from '../repository/employee.repository';
import type {
  EmployeeListItemRecord,
  EmployeeMovementRecord,
  EmployeeProfileRecord,
  EmployeeTimeOffRecord,
} from '../repository/record/employee.record';
import { minusDays, todayUtc } from './calendar-date';
import type { EmployeeSortField } from './employee-sort';
import type { EmployeeStatus } from './employee-status';
import type {
  CreateEmployeeCommand,
  EmployeeBirthdays,
  EmployeeCalendarPage,
  EmployeeForTimeOff,
  EmployeeMovement,
  EmployeeMovements,
  EmployeeProfile,
  TerminateEmployeeCommand,
  UpdateEmployeeCommand,
  EmployeePage,
  EmployeeSummary,
} from './employee.types';
import { toSearchTerms } from './filter/employee.criteria';
import { isTerminationReason } from './termination-reason';

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
   * employee record with responsibles, in one transaction. For the employment module, which adds the
   * starting salary in the same transaction.
   */
  @Transactional()
  async create(command: CreateEmployeeCommand, actorId: string): Promise<EmployeeListItemRecord> {
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
      (await this.employeeRepository.countResponsibleCandidates(responsibleUserIds)) !==
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
      dateOfBirth: command.dateOfBirth ? new Date(`${command.dateOfBirth}T00:00:00Z`) : undefined,
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

  /**
   * Replaces who is responsible for the employee (0–10 admins, never the
   * employee themselves). Records the change; a save without one changes nothing.
   */
  @Transactional()
  async updateResponsibles(
    employeeId: string,
    command: { responsibleUserIds: string[]; version: number },
    actorId: string,
  ): Promise<EmployeeProfile> {
    const before = await this.employeeRepository.findProfileById(employeeId);
    if (!before) {
      throw new ResourceNotFoundException();
    }
    if (before.version !== command.version) {
      throw new ConcurrentModificationException();
    }
    const responsibleUserIds = [...new Set(command.responsibleUserIds)];
    if (responsibleUserIds.includes(before.user.id)) {
      throw new BusinessRuleException('errors.employee.selfResponsible', {}, 'responsibleUserIds');
    }
    if (!(await this.areResponsibleCandidates(responsibleUserIds))) {
      throw new BusinessRuleException(
        'errors.employee.responsibleNotFound',
        {},
        'responsibleUserIds',
      );
    }
    const current = before.responsibles.map(({ responsible }) => responsible.id).sort();
    const next = [...responsibleUserIds].sort();
    if (current.length === next.length && current.every((id, index) => id === next[index])) {
      // Nothing changed: no write, no history entry.
      return { employee: before, today: todayUtc() };
    }
    if (
      !(await this.employeeRepository.replaceResponsibles(
        employeeId,
        command.version,
        responsibleUserIds,
        actorId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    const after = await this.employeeRepository.findProfileById(employeeId);
    if (!after) {
      throw new Error('Updated employee not found in the same transaction');
    }
    await this.auditService.record({
      action: AuditAction.EMPLOYEE_UPDATED,
      employeeId,
      target: {
        type: AuditTargetType.EMPLOYEE,
        id: employeeId,
        label: `${after.user.firstName} ${after.user.lastName}`,
      },
      changes: changeOf(AuditField.RESPONSIBLES, peopleOf(before), peopleOf(after)),
    });
    return { employee: after, today: todayUtc() };
  }

  /**
   * Name, work email, position, start date and contacts. For the employment module, which moves
   * the starting salary along with the start date in the same transaction. Records what changed
   * (contacts as "changed" only); a save without changes writes nothing.
   */
  @Transactional()
  async update(
    employeeId: string,
    command: UpdateEmployeeCommand,
    actorId: string,
  ): Promise<{ before: EmployeeProfileRecord; after: EmployeeProfileRecord }> {
    const before = await this.requireProfile(employeeId, command.version);
    const email = command.email.toLowerCase();
    if (await this.userService.isEmailTakenByOther(email, before.user.id)) {
      throw new BusinessConflictException('errors.employee.emailTaken', { email }, 'email');
    }
    if (!(await this.employeeRepository.positionExists(command.positionId))) {
      throw new BusinessRuleException('errors.employee.positionNotFound', {}, 'positionId');
    }
    const startDate = new Date(`${command.startDate}T00:00:00Z`);
    if (before.terminatedOn && startDate > before.terminatedOn) {
      throw new BusinessRuleException('errors.employee.startAfterTermination', {}, 'startDate');
    }
    const details = {
      positionId: command.positionId,
      startDate,
      mobile: command.mobile ?? null,
      personalEmail: command.personalEmail?.toLowerCase() ?? null,
      linkedinUrl: command.linkedinUrl ?? null,
      telegram: command.telegram ? `@${command.telegram.replace(/^@/, '')}` : null,
      address: command.address ?? null,
      dateOfBirth: command.dateOfBirth ? new Date(`${command.dateOfBirth}T00:00:00Z`) : null,
    };
    const contactChanges: AuditChange[] = CONTACT_FIELDS.flatMap(([column, field]) =>
      before[column] === details[column]
        ? []
        : [
            {
              field,
              from: before[column] === null ? null : auditValue.redacted(),
              to: details[column] === null ? null : auditValue.redacted(),
            },
          ],
    );
    // Personal data like the contacts: the log says that it changed, never the date.
    const dateOfBirthChanged =
      (before.dateOfBirth?.getTime() ?? null) !== (details.dateOfBirth?.getTime() ?? null);
    if (dateOfBirthChanged) {
      contactChanges.push({
        field: AuditField.DATE_OF_BIRTH,
        from: before.dateOfBirth === null ? null : auditValue.redacted(),
        to: details.dateOfBirth === null ? null : auditValue.redacted(),
      });
    }
    const identityChanged =
      before.user.firstName !== command.firstName ||
      before.user.lastName !== command.lastName ||
      before.user.email !== email;
    const detailsChanged =
      before.position.id !== details.positionId ||
      before.startDate.getTime() !== startDate.getTime() ||
      contactChanges.length > 0;
    if (!identityChanged && !detailsChanged) {
      return { before, after: before };
    }
    if (identityChanged) {
      await this.userService.updateIdentity(
        before.user.id,
        { firstName: command.firstName, lastName: command.lastName, email },
        actorId,
      );
    }
    if (
      !(await this.employeeRepository.updateDetails(employeeId, command.version, details, actorId))
    ) {
      throw new ConcurrentModificationException();
    }
    const after = await this.requireProfile(employeeId);
    await this.auditService.record({
      action: AuditAction.EMPLOYEE_UPDATED,
      employeeId,
      target: { type: AuditTargetType.EMPLOYEE, id: employeeId, label: nameOf(after) },
      changes: [
        ...changeOf(
          AuditField.FIRST_NAME,
          auditValue.text(before.user.firstName),
          auditValue.text(after.user.firstName),
        ),
        ...changeOf(
          AuditField.LAST_NAME,
          auditValue.text(before.user.lastName),
          auditValue.text(after.user.lastName),
        ),
        ...changeOf(
          AuditField.EMAIL,
          auditValue.text(before.user.email),
          auditValue.text(after.user.email),
        ),
        ...changeOf(
          AuditField.POSITION,
          auditValue.text(before.position.title),
          auditValue.text(after.position.title),
        ),
        ...changeOf(
          AuditField.START_DATE,
          auditValue.date(before.startDate),
          auditValue.date(after.startDate),
        ),
        ...contactChanges,
      ],
    });
    return { before, after };
  }

  /**
   * Terminates the employee from `date` (today, past or future — a future date is a planned
   * leave), or changes an existing termination. For the employment module, which cancels the
   * reviews scheduled after that date in the same transaction.
   */
  @Transactional()
  async terminate(
    employeeId: string,
    command: TerminateEmployeeCommand,
    actorId: string,
  ): Promise<{ before: EmployeeProfileRecord; after: EmployeeProfileRecord }> {
    const before = await this.requireProfile(employeeId, command.version);
    const terminatedOn = new Date(`${command.date}T00:00:00Z`);
    if (terminatedOn < before.startDate) {
      throw new BusinessRuleException('errors.employee.terminationBeforeStart', {}, 'date');
    }
    if (!isTerminationReason(command.reason)) {
      throw new BusinessRuleException('errors.employee.terminationReasonInvalid', {}, 'reason');
    }
    const comment = command.comment ?? null;
    const changes = [
      ...changeOf(
        AuditField.TERMINATION_DATE,
        before.terminatedOn ? auditValue.date(before.terminatedOn) : null,
        auditValue.date(terminatedOn),
      ),
      ...changeOf(
        AuditField.TERMINATION_REASON,
        before.terminationReason ? auditValue.terminationReason(before.terminationReason) : null,
        auditValue.terminationReason(command.reason),
      ),
      ...changeOf(
        AuditField.TERMINATION_COMMENT,
        before.terminationComment ? auditValue.text(before.terminationComment) : null,
        comment ? auditValue.text(comment) : null,
      ),
    ];
    if (changes.length === 0) {
      return { before, after: before };
    }
    if (
      !(await this.employeeRepository.updateTermination(
        employeeId,
        command.version,
        { terminatedOn, reason: command.reason, comment },
        actorId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    const after = await this.requireProfile(employeeId);
    await this.auditService.record({
      action: AuditAction.EMPLOYEE_TERMINATED,
      employeeId,
      target: { type: AuditTargetType.EMPLOYEE, id: employeeId, label: nameOf(after) },
      changes,
    });
    return { before, after };
  }

  /** Takes a termination back (the employee is active again). Not terminated → nothing to do. */
  @Transactional()
  async cancelTermination(
    employeeId: string,
    version: number,
    actorId: string,
  ): Promise<EmployeeProfileRecord> {
    const before = await this.requireProfile(employeeId, version);
    if (!before.terminatedOn) {
      return before;
    }
    if (!(await this.employeeRepository.updateTermination(employeeId, version, null, actorId))) {
      throw new ConcurrentModificationException();
    }
    await this.auditService.record({
      action: AuditAction.EMPLOYEE_TERMINATION_CANCELED,
      employeeId,
      target: { type: AuditTargetType.EMPLOYEE, id: employeeId, label: nameOf(before) },
      changes: [
        ...changeOf(AuditField.TERMINATION_DATE, auditValue.date(before.terminatedOn), null),
        ...(before.terminationReason
          ? changeOf(
              AuditField.TERMINATION_REASON,
              auditValue.terminationReason(before.terminationReason),
              null,
            )
          : []),
        ...(before.terminationComment
          ? changeOf(
              AuditField.TERMINATION_COMMENT,
              auditValue.text(before.terminationComment),
              null,
            )
          : []),
      ],
    });
    return this.requireProfile(employeeId);
  }

  /** 404 for an unknown employee; with `version`, 409 when it is not the current one. */
  private async requireProfile(
    employeeId: string,
    version?: number,
  ): Promise<EmployeeProfileRecord> {
    const employee = await this.employeeRepository.findProfileById(employeeId);
    if (!employee) {
      throw new ResourceNotFoundException();
    }
    if (version !== undefined && employee.version !== version) {
      throw new ConcurrentModificationException();
    }
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

  /** For other modules (time off): the caller's employee record; null for admins (none). */
  async findForTimeOffByUserId(userId: string): Promise<EmployeeForTimeOff | null> {
    const employee = await this.employeeRepository.findTimeOffByUserId(userId);
    return employee ? toTimeOff(employee) : null;
  }

  /** For other modules (time off): one employee; null when unknown. */
  async findForTimeOff(employeeId: string): Promise<EmployeeForTimeOff | null> {
    const employee = await this.employeeRepository.findTimeOffById(employeeId);
    return employee ? toTimeOff(employee) : null;
  }

  /** For other modules (time-off calendar): people employed on at least one day of [from, to]. */
  async findCalendarPage(
    search: string | undefined,
    from: Date,
    to: Date,
    pageable: Pageable<EmployeeSortField>,
  ): Promise<EmployeeCalendarPage> {
    const page = await this.employeeRepository.findCalendarPage(
      { searchTerms: toSearchTerms(search), from, to },
      pageable,
    );
    return {
      content: page.content.map((employee) => ({
        id: employee.id,
        userId: employee.user.id,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        positionTitle: employee.position.title,
        startDate: employee.startDate,
        terminatedOn: employee.terminatedOn,
      })),
      totalElements: page.totalElements,
    };
  }

  /**
   * For other modules (dashboard): birthdays between `from` and `to` (one month) of people employed
   * on at least one day of it, a page at a time. 29 February birthdays count on the 28th in a year
   * without one.
   */
  async birthdays(
    range: { from: Date; to: Date },
    page: { page: number; size: number },
  ): Promise<EmployeeBirthdays> {
    const { from, to } = range;
    const year = from.getUTCFullYear();
    const month = from.getUTCMonth() + 1;
    const isLeap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
    const days = Array.from(
      { length: to.getUTCDate() - from.getUTCDate() + 1 },
      (_, index) => from.getUTCDate() + index,
    );
    if (month === 2 && !isLeap && days.includes(28)) {
      days.push(29);
    }
    const result = await this.employeeRepository.findBirthdays(
      { from, to, month, days },
      { offset: page.page * page.size, limit: page.size },
    );
    return {
      content: result.content.map(({ id, ...row }) => ({ employeeId: id, ...row })),
      totalElements: result.totalElements,
    };
  }

  /** For other modules (dashboard): who starts and who leaves in the next `days` days. */
  async movements(today: Date, days: number): Promise<EmployeeMovements> {
    const until = new Date(today.getTime() + days * 86_400_000);
    const [joining, leaving] = await Promise.all([
      this.employeeRepository.findStartingBetween(today, until),
      this.employeeRepository.findLeavingBetween(today, until),
    ]);
    const events: EmployeeMovement[] = [
      ...joining.map((employee) => movementOf('JOINING', employee.startDate, employee)),
      ...leaving.flatMap((employee) =>
        employee.terminatedOn ? [movementOf('LEAVING', employee.terminatedOn, employee)] : [],
      ),
    ].sort((left, right) => left.date.getTime() - right.date.getTime());
    return { joining: joining.length, leaving: leaving.length, next: events[0] ?? null };
  }

  /** For other modules: does the employee exist? */
  exists(id: string): Promise<boolean> {
    return this.employeeRepository.existsById(id);
  }

  /** For other modules: are all these users admins (possible responsibles)? */
  async areResponsibleCandidates(userIds: string[]): Promise<boolean> {
    const unique = [...new Set(userIds)];
    return (
      unique.length === 0 ||
      (await this.employeeRepository.countResponsibleCandidates(unique)) === unique.length
    );
  }

  positionOptions() {
    return this.employeeRepository.findPositionOptions();
  }

  responsibleCandidates(search: string | undefined) {
    return this.employeeRepository.findResponsibleCandidates(toSearchTerms(search));
  }
}

const nameOf = (employee: EmployeeProfileRecord): string =>
  `${employee.user.firstName} ${employee.user.lastName}`;

/** Personal contacts: the log says that they changed, never their values. */
const CONTACT_FIELDS = [
  ['mobile', AuditField.MOBILE],
  ['personalEmail', AuditField.PERSONAL_EMAIL],
  ['linkedinUrl', AuditField.LINKEDIN_URL],
  ['telegram', AuditField.TELEGRAM],
  ['address', AuditField.ADDRESS],
] as const;

/** Responsible people as an audit value, sorted by id so order never reads as a change. */
const peopleOf = (employee: EmployeeProfileRecord) => {
  const people = employee.responsibles
    .map(({ responsible }) => ({
      id: responsible.id,
      firstName: responsible.firstName,
      lastName: responsible.lastName,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return people.length > 0 ? auditValue.people(people) : null;
};

const toTimeOff = (employee: EmployeeTimeOffRecord): EmployeeForTimeOff => ({
  id: employee.id,
  startDate: employee.startDate,
  terminatedOn: employee.terminatedOn,
  responsibleUserIds: employee.responsibles.map(({ responsibleUserId }) => responsibleUserId),
});

const movementOf = (
  kind: EmployeeMovement['kind'],
  date: Date,
  employee: EmployeeMovementRecord,
): EmployeeMovement => ({
  kind,
  date,
  employeeId: employee.id,
  userId: employee.user.id,
  firstName: employee.user.firstName,
  lastName: employee.user.lastName,
});
