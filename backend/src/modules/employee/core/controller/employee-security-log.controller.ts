import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../../common/dto/pageable';
import { toSecurityEventPage } from '../../../../common/dto/security-event.response';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { can } from '../../../../common/security/policies';
import { Authorize } from '../../../../common/security/security.decorators';
import { AUDIT_EVENT_PAGEABLE, type AuditEventSortField } from '../../../audit/service/audit-sort';
import { EmployeeService } from '../service/employee.service';
import { EmployeeSecurityLogResponse } from './dto/employee-security-log.response';

@ApiTags('Employees')
@Controller('api/v1/employees/:employeeId/security-log')
export class EmployeeSecurityLogController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Authorize(can.viewEmployeeActivity)
  @ApiOperation({
    summary:
      "An employee's security log (sign-ins, password changes, ended sessions), newest first",
  })
  @ApiPageable(AUDIT_EVENT_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeSecurityLogResponse })
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
  ): Promise<EmployeeSecurityLogResponse> {
    return toSecurityEventPage(await this.employeeService.findSecurityLog(employeeId, pageable));
  }
}
