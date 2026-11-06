import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { DashboardService } from '../service/dashboard.service';
import { AdminDashboardResponse } from './dto/admin-dashboard.response';
import { toAdminDashboardResponse } from './mapper/admin-dashboard.mapper';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Authorize(can.admin)
  @ApiOperation({
    summary:
      'Admin dashboard: pending time-off requests, who is off today, reviews due and people starting / leaving',
  })
  @ZodResponse({ status: HttpStatus.OK, type: AdminDashboardResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async admin(): Promise<AdminDashboardResponse> {
    return toAdminDashboardResponse(await this.dashboardService.adminDashboard());
  }
}
