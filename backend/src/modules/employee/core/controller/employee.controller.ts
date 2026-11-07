import { Body, Controller, Get, HttpStatus, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../../common/dto/pageable';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { EMPLOYEE_PAGEABLE, type EmployeeSortField } from '../service/employee-sort';
import { EmployeeService } from '../service/employee.service';
import { EmployeeProfileResponse } from './dto/employee-profile.response';
import { EmployeeFilterQuery } from './dto/employee-filter.query';
import { UpdateResponsiblesRequest } from './dto/update-responsibles.request';
import { EmployeePageResponse, EmployeeSummaryResponse } from './dto/employee.response';
import { toEmployeeProfileResponse } from './mapper/employee-profile.mapper';
import { toEmployeePageResponse } from './mapper/employee.mapper';

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
    @CurrentPrincipal() principal: Principal,
    @Query() query: EmployeeFilterQuery,
    @PageableQuery(EMPLOYEE_PAGEABLE) pageable: Pageable<EmployeeSortField>,
  ): Promise<EmployeePageResponse> {
    return toEmployeePageResponse(
      await this.employeeService.findPage(
        principal.organisationId,
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
  summary(@CurrentPrincipal() principal: Principal): Promise<EmployeeSummaryResponse> {
    return this.employeeService.summary(principal.organisationId);
  }

  // Declared after the static `summary` route, so ":employeeId" never captures it.
  @Get(':employeeId')
  @Authorize(can.viewEmployee)
  @ApiOperation({ summary: 'Return one employee with contacts and responsibles' })
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeProfileResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async profile(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('employeeId') employeeId: string,
  ): Promise<EmployeeProfileResponse> {
    const { employee, today } = await this.employeeService.findProfile(
      principal.organisationId,
      employeeId,
    );
    return toEmployeeProfileResponse(employee, today);
  }

  @Put(':employeeId/responsibles')
  @Authorize(can.manageEmployee)
  @ApiOperation({
    summary: "Replace the employee's responsible people; the version must match the one read",
  })
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeProfileResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONCURRENT_MODIFICATION',
    'BUSINESS_RULE_VIOLATION',
  )
  async updateResponsibles(
    @UuidParam('employeeId') employeeId: string,
    @Body() request: UpdateResponsiblesRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<EmployeeProfileResponse> {
    const { employee, today } = await this.employeeService.updateResponsibles(
      principal.organisationId,
      employeeId,
      { responsibleUserIds: request.responsibleUserIds, version: request.version },
      principal.userId,
    );
    return toEmployeeProfileResponse(employee, today);
  }
}
