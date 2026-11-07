import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { DashboardService } from '../service/dashboard.service';
import {
  AdminDashboardResponse,
  DashboardBirthdaysResponse,
  DashboardRequestsResponse,
  DashboardReviewsResponse,
} from './dto/admin-dashboard.response';
import {
  DateRangeQuery,
  EVENTS_PAGEABLE,
  type EventsSortField,
  InstantRangeQuery,
} from './dto/dashboard-events.query';
import {
  toAdminDashboardResponse,
  toDashboardBirthdaysResponse,
  toDashboardRequestsResponse,
  toDashboardReviewsResponse,
} from './mapper/admin-dashboard.mapper';

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

  @Get('admin/requests')
  @Authorize(can.admin)
  @ApiOperation({
    summary: 'Time-off requests made in a day (today, UTC) (any status, newest first, first 100)',
  })
  @ZodResponse({ status: HttpStatus.OK, type: DashboardRequestsResponse })
  @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async requests(@Query() query: InstantRangeQuery): Promise<DashboardRequestsResponse> {
    return toDashboardRequestsResponse(
      await this.dashboardService.requestsMadeBetween(query.from, query.to),
    );
  }

  @Get('admin/reviews')
  @Authorize(can.admin)
  @ApiOperation({
    summary: 'Scheduled and completed reviews dated in a day or month, by date then name (paged)',
  })
  @ApiPageable(EVENTS_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: DashboardReviewsResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async reviews(
    @Query() query: DateRangeQuery,
    @PageableQuery(EVENTS_PAGEABLE) pageable: Pageable<EventsSortField>,
  ): Promise<DashboardReviewsResponse> {
    return toDashboardReviewsResponse(await this.dashboardService.reviews(query, pageable));
  }

  @Get('admin/birthdays')
  @Authorize(can.admin)
  @ApiOperation({
    summary:
      'Birthdays (day and month) in a day or month of people employed then, by day then name (paged)',
  })
  @ApiPageable(EVENTS_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: DashboardBirthdaysResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async birthdays(
    @Query() query: DateRangeQuery,
    @PageableQuery(EVENTS_PAGEABLE) pageable: Pageable<EventsSortField>,
  ): Promise<DashboardBirthdaysResponse> {
    return toDashboardBirthdaysResponse(await this.dashboardService.birthdays(query, pageable));
  }
}
