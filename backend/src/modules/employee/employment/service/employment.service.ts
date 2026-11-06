import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
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
  ) {}

  /** One transaction: the employee never exists without a starting salary. */
  @Transactional()
  async hire(command: HireEmployeeCommand, actorId: string): Promise<HiredEmployee> {
    const { startingSalary, ...employeeCommand } = command;
    const employee = await this.employeeService.create(employeeCommand, actorId);
    const responsibleUserIds = [...new Set(command.responsibleUserIds)];
    await this.reviewService.createStarting(
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
  async update(employeeId: string, command: UpdateEmployeeCommand, actorId: string): Promise<void> {
    const { before, after } = await this.employeeService.update(employeeId, command, actorId);
    if (before.startDate.getTime() !== after.startDate.getTime()) {
      await this.reviewService.moveStarting(employeeId, command.startDate, actorId);
    }
  }

  /** Terminate (or change the termination); reviews scheduled after that day are canceled. */
  @Transactional()
  async terminate(
    employeeId: string,
    command: TerminateEmployeeCommand,
    actorId: string,
  ): Promise<void> {
    await this.employeeService.terminate(employeeId, command, actorId);
    await this.reviewService.cancelScheduledAfter(employeeId, command.date, actorId);
  }

  /** The employee is active again; reviews canceled by the termination stay canceled. */
  @Transactional()
  async cancelTermination(employeeId: string, version: number, actorId: string): Promise<void> {
    await this.employeeService.cancelTermination(employeeId, version, actorId);
  }
}
