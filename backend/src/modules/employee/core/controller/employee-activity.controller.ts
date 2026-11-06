import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../../common/dto/pageable';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { can } from '../../../../common/security/policies';
import { Authorize } from '../../../../common/security/security.decorators';
import { AUDIT_EVENT_PAGEABLE, type AuditEventSortField } from '../../../audit/service/audit-sort';
import { EmployeeService } from '../service/employee.service';
import { EmployeeActivityPageResponse } from './dto/employee-activity.response';
import { toEmployeeActivityPageResponse } from './mapper/employee-activity.mapper';

@ApiTags('Employees')
@Controller('api/v1/employees/:employeeId/activity')
export class EmployeeActivityController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Authorize(can.viewEmployeeActivity)
  @ApiOperation({
    summary: "List changes made to an employee's records, newest first, with who made them",
  })
  @ApiPageable(AUDIT_EVENT_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeActivityPageResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async list(
    @UuidParam('employeeId') employeeId: string,
    @PageableQuery(AUDIT_EVENT_PAGEABLE) pageable: Pageable<AuditEventSortField>,
  ): Promise<EmployeeActivityPageResponse> {
    return toEmployeeActivityPageResponse(
      await this.employeeService.findActivity(employeeId, pageable),
    );
  }
}
