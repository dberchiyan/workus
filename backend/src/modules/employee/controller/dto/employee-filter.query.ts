import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EMPLOYEE_STATUSES, EmployeeStatus } from '../../service/employee-status';

export const SEARCH_MAX_LENGTH = 100;

export const EmployeeStatusSchema = z.enum(EMPLOYEE_STATUSES).meta({ id: 'EmployeeStatus' });

const filterFields = {
  search: z.string().trim().max(SEARCH_MAX_LENGTH, 'validation.search.tooLong').optional(),
  status: EmployeeStatusSchema.default(EmployeeStatus.ACTIVE),
};

export const EmployeeFilterQuerySchema = z.object({
  ...filterFields,
  categoryId: z.uuid('validation.invalid').optional(),
});

export class EmployeeFilterQuery extends createZodDto(EmployeeFilterQuerySchema) {}

export const PositionCategoryFilterQuerySchema = z.object(filterFields);

export class PositionCategoryFilterQuery extends createZodDto(PositionCategoryFilterQuerySchema) {}
