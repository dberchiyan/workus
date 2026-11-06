import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { TimeOffService } from '../service/time-off.service';
import { LeaveBalancesResponse } from './dto/time-off.response';
import { toLeaveBalancesResponse } from './mapper/time-off.mapper';

/** An employee's leave balances on their profile (admin). */
@ApiTags('Time off')
@Controller('api/v1/employees/:employeeId/time-off')
export class EmployeeTimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Get('balances')
  @Authorize(can.viewEmployee)
  @ApiOperation({ summary: "An employee's leave balances in the current cycles" })
  @ZodResponse({ status: HttpStatus.OK, type: LeaveBalancesResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async balances(@UuidParam('employeeId') employeeId: string): Promise<LeaveBalancesResponse> {
    return toLeaveBalancesResponse(await this.timeOffService.findBalances(employeeId));
  }
}
