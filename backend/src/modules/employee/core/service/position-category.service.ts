import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '../repository/employee.repository';
import { PositionCategoryRepository } from '../repository/position-category.repository';
import { todayUtc } from './calendar-date';
import type { EmployeeStatus } from './employee-status';
import type { CategoryCounts } from './employee.types';
import { toSearchTerms } from './filter/employee.criteria';

@Injectable()
export class PositionCategoryService {
  constructor(
    private readonly positionCategoryRepository: PositionCategoryRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  /** Categories from the database with how many employees match the current search and status. */
  async countEmployees(
    organisationId: string,
    search: string | undefined,
    status: EmployeeStatus,
  ): Promise<CategoryCounts> {
    const [categories, countByPosition] = await Promise.all([
      this.positionCategoryRepository.findAllOrdered(),
      this.employeeRepository.countByPosition(organisationId, {
        searchTerms: toSearchTerms(search),
        status,
        today: todayUtc(),
      }),
    ]);
    const withCounts = categories.map((category) => ({
      id: category.id,
      name: category.name,
      employeeCount: category.positions.reduce(
        (sum, position) => sum + (countByPosition.get(position.id) ?? 0),
        0,
      ),
    }));
    return {
      total: [...countByPosition.values()].reduce((sum, count) => sum + count, 0),
      categories: withCounts,
    };
  }
}
