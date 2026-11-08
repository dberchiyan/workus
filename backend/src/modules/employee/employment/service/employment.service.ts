import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../../auth/service/password-hasher.service';
import { SessionService } from '../../../auth/service/session.service';
import { todayUtc } from '../../core/service/calendar-date';
import { EmployeeService } from '../../core/service/employee.service';
import { ReviewService } from '../../review/service/review.service';
import type {
  HiredEmployee,
  HireEmployeeCommand,
  TerminateEmployeeCommand,
  UpdateEmployeeCommand,
} from './employment.types';

/**
 * Employment events that span the employee and their reviews: hiring (with the starting
 * salary), editing the profile (the starting salary follows the start date) and terminating
 * (reviews scheduled after the last day are canceled). Lives here because review already
 * depends on employee. Each is one transaction.
 */
@Injectable()
export class EmploymentService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly reviewService: ReviewService,
    private readonly sessionService: SessionService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /**
   * Hires with a generated password, returned once for the admin to hand over (only its hash is
   * stored). Hashing is CPU work, done before the transaction opens.
   */
  async hire(
    organisationId: string,
    command: HireEmployeeCommand,
    actorId: string,
  ): Promise<HiredEmployee> {
    const temporaryPassword = this.passwordHasher.generateTemporary();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const employee = await this.hireWithPassword(organisationId, command, passwordHash, actorId);
    return { ...employee, temporaryPassword };
  }

  /** One transaction: the employee never exists without a starting salary. */
  @Transactional()
  private async hireWithPassword(
    organisationId: string,
    command: HireEmployeeCommand,
    passwordHash: string,
    actorId: string,
  ): Promise<Omit<HiredEmployee, 'temporaryPassword'>> {
    const { startingSalary, ...employeeCommand } = command;
    const employee = await this.employeeService.create(
      organisationId,
      employeeCommand,
      passwordHash,
      actorId,
    );
    const responsibleUserIds = [...new Set(command.responsibleUserIds)];
    await this.reviewService.createStarting(
      organisationId,
      employee.id,
      {
        startDate: command.startDate,
        salary: startingSalary,
        // A review needs someone responsible: the employee's people, otherwise whoever hired.
        responsibleUserIds: responsibleUserIds.length > 0 ? responsibleUserIds : [actorId],
      },
      actorId,
    );
    return {
      id: employee.id,
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
    };
  }

  /** Edit the profile; a changed start date moves the starting salary with it. */
  @Transactional()
  async update(
    organisationId: string,
    employeeId: string,
    command: UpdateEmployeeCommand,
    actorId: string,
  ): Promise<void> {
    const { before, after } = await this.employeeService.update(
      organisationId,
      employeeId,
      command,
      actorId,
    );
    if (before.startDate.getTime() !== after.startDate.getTime()) {
      await this.reviewService.moveStarting(organisationId, employeeId, command.startDate, actorId);
    }
  }

  /** Terminate (or change the termination); reviews scheduled after that day are canceled. */
  @Transactional()
  async terminate(
    organisationId: string,
    employeeId: string,
    command: TerminateEmployeeCommand,
    actorId: string,
  ): Promise<void> {
    const { after } = await this.employeeService.terminate(
      organisationId,
      employeeId,
      command,
      actorId,
    );
    await this.reviewService.cancelScheduledAfter(
      organisationId,
      employeeId,
      command.date,
      actorId,
    );
    // Effective today or earlier: signed out now (a later date is handled on its day).
    if (after.terminatedOn && after.terminatedOn <= todayUtc()) {
      await this.sessionService.endForTermination([{ userId: after.user.id, organisationId }]);
    }
  }

  /** The employee is active again; reviews canceled by the termination stay canceled. */
  @Transactional()
  async cancelTermination(
    organisationId: string,
    employeeId: string,
    version: number,
    actorId: string,
  ): Promise<void> {
    await this.employeeService.cancelTermination(organisationId, employeeId, version, actorId);
  }
}
