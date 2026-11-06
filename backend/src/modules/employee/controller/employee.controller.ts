import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import { EMPLOYEE_PAGEABLE, type EmployeeSortField } from '../service/employee-sort';
import { EmployeeService } from '../service/employee.service';
import { CreateEmployeeRequest } from './dto/create-employee.request';
import { EmployeeFilterQuery } from './dto/employee-filter.query';
import {
  EmployeeListItemResponse,
  EmployeePageResponse,
  EmployeeSummaryResponse,
} from './dto/employee.response';
import { toEmployeeListItem, toEmployeePageResponse } from './mapper/employee.mapper';

@ApiTags('Employees')
@Controller('api/v1/employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Authorize(can.viewEmployees)
  @ApiOperation({ summary: 'List employees with search, status and category filters' })
  @ApiPageable(EMPLOYEE_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: EmployeePageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async list(
    @Query() query: EmployeeFilterQuery,
    @PageableQuery(EMPLOYEE_PAGEABLE) pageable: Pageable<EmployeeSortField>,
  ): Promise<EmployeePageResponse> {
    return toEmployeePageResponse(
      await this.employeeService.findPage(
        { search: query.search, status: query.status, categoryId: query.categoryId },
        pageable,
      ),
    );
  }

  @Get('summary')
  @Authorize(can.viewEmployees)
  @ApiOperation({
    summary:
      'Return the active headcount, hires of the last 30 days and terminations of the last 90',
  })
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeSummaryResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  summary(): Promise<EmployeeSummaryResponse> {
    return this.employeeService.summary();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageEmployees)
  @Idempotent()
  @ApiOperation({ summary: 'Create an employee with their account and responsibles' })
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeListItemResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'CONFLICT',
    'IDEMPOTENCY_KEY_REUSED',
    'BUSINESS_RULE_VIOLATION',
  )
  async create(
    @Body() request: CreateEmployeeRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<EmployeeListItemResponse> {
    const { employee, today } = await this.employeeService.create(
      {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        positionId: request.positionId,
        startDate: request.startDate,
        mobile: request.mobile,
        personalEmail: request.personalEmail,
        linkedinUrl: request.linkedinUrl,
        telegram: request.telegram,
        address: request.address,
        responsibleUserIds: request.responsibleUserIds,
      },
      principal.userId,
    );
    return toEmployeeListItem(employee, today);
  }
}
