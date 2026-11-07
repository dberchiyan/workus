import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { EmploymentService } from '../service/employment.service';
import { CreateEmployeeRequest, UpdateEmployeeRequest } from './dto/hire-employee.request';
import { CancelTerminationRequest, TerminateEmployeeRequest } from './dto/termination.request';
import { HiredEmployeeResponse } from './dto/hired-employee.response';

@ApiTags('Employees')
@Controller('api/v1/employees')
export class EmploymentController {
  constructor(private readonly employmentService: EmploymentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageEmployees)
  @Idempotent()
  @ApiOperation({
    summary: 'Create an employee with their account, responsibles and starting salary',
  })
  @ZodResponse({ status: HttpStatus.OK, type: HiredEmployeeResponse })
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
  hire(
    @Body() request: CreateEmployeeRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<HiredEmployeeResponse> {
    return this.employmentService.hire(
      principal.organisationId,
      {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        positionId: request.positionId,
        startDate: request.startDate,
        startingSalary: request.startingSalary,
        mobile: request.mobile,
        personalEmail: request.personalEmail,
        linkedinUrl: request.linkedinUrl,
        telegram: request.telegram,
        address: request.address,
        dateOfBirth: request.dateOfBirth,
        responsibleUserIds: request.responsibleUserIds,
      },
      principal.userId,
    );
  }

  @Put(':employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageEmployee)
  @ApiOperation({
    summary:
      'Edit name, work email, position, start date and contacts; the version must match the one read',
  })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONFLICT',
    'CONCURRENT_MODIFICATION',
    'BUSINESS_RULE_VIOLATION',
  )
  async update(
    @UuidParam('employeeId') employeeId: string,
    @Body() request: UpdateEmployeeRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<void> {
    await this.employmentService.update(
      principal.organisationId,
      employeeId,
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
        dateOfBirth: request.dateOfBirth,
        version: request.version,
      },
      principal.userId,
    );
  }

  @Put(':employeeId/termination')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageEmployee)
  @ApiOperation({
    summary:
      'Terminate the employee from a date (or change the termination); later scheduled reviews are canceled',
  })
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
  async terminate(
    @UuidParam('employeeId') employeeId: string,
    @Body() request: TerminateEmployeeRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<void> {
    await this.employmentService.terminate(
      principal.organisationId,
      employeeId,
      {
        date: request.date,
        reason: request.reason,
        comment: request.comment,
        version: request.version,
      },
      principal.userId,
    );
  }

  /** A body on DELETE carries the version (optimistic locking), as on PUT. */
  @Delete(':employeeId/termination')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageEmployee)
  @ApiOperation({ summary: 'Cancel the termination; the employee is active again' })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONCURRENT_MODIFICATION',
  )
  async cancelTermination(
    @UuidParam('employeeId') employeeId: string,
    @Body() request: CancelTerminationRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<void> {
    await this.employmentService.cancelTermination(
      principal.organisationId,
      employeeId,
      request.version,
      principal.userId,
    );
  }
}
