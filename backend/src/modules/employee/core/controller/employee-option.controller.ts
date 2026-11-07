import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import type { Principal } from '../../../../common/security/principal';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { can } from '../../../../common/security/policies';
import { Authorize } from '../../../../common/security/security.decorators';
import { EmployeeService } from '../service/employee.service';
import {
  PositionOptionsResponse,
  ResponsibleCandidateQuery,
  ResponsibleCandidatesResponse,
} from './dto/employee-options.response';
import {
  toPositionOptionsResponse,
  toResponsibleCandidatesResponse,
} from './mapper/employee.mapper';

/** Choices for the "Add employee" form. */
@ApiTags('Employees')
@Controller('api/v1')
export class EmployeeOptionController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('positions')
  @Authorize(can.manageEmployees)
  @ApiOperation({ summary: 'List positions grouped by category, for the position picker' })
  @ZodResponse({ status: HttpStatus.OK, type: PositionOptionsResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async positions(): Promise<PositionOptionsResponse> {
    return toPositionOptionsResponse(await this.employeeService.positionOptions());
  }

  @Get('responsible-candidates')
  @Authorize(can.manageEmployees)
  @ApiOperation({ summary: 'Search people who can be responsible for an employee' })
  @ZodResponse({ status: HttpStatus.OK, type: ResponsibleCandidatesResponse })
  @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async responsibleCandidates(
    @CurrentPrincipal() principal: Principal,
    @Query() query: ResponsibleCandidateQuery,
  ): Promise<ResponsibleCandidatesResponse> {
    return toResponsibleCandidatesResponse(
      await this.employeeService.responsibleCandidates(principal.organisationId, query.search),
    );
  }
}
