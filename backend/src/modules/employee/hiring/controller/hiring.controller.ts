import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { HiringService } from '../service/hiring.service';
import { CreateEmployeeRequest } from './dto/hire-employee.request';
import { HiredEmployeeResponse } from './dto/hired-employee.response';

@ApiTags('Employees')
@Controller('api/v1/employees')
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

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
    return this.hiringService.hire(
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
        responsibleUserIds: request.responsibleUserIds,
      },
      principal.userId,
    );
  }
}
