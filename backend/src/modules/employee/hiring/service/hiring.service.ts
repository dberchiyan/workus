import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../core/service/employee.service';
import { ReviewService } from '../../review/service/review.service';
import type { HiredEmployee, HireEmployeeCommand } from './hiring.types';

/**
 * Adding an employee spans two modules: the employee record (with their account) and the
 * starting salary, which opens the salary history. Lives here because review already depends
 * on employee.
 */
@Injectable()
export class HiringService {
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
}
