import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { Idempotent, IdempotencyExempt } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import { TIME_OFF_REQUEST_PAGEABLE, type TimeOffRequestSortField } from '../service/time-off-sort';
import { TimeOffCommentService } from '../service/time-off-comment.service';
import { TimeOffService } from '../service/time-off.service';
import { AddTimeOffCommentRequest } from './dto/add-time-off-comment.request';
import { CreateTimeOffRequestRequest } from './dto/create-time-off-request.request';
import { TimeOffRequestFilterQuery } from './dto/time-off-request-filter.query';
import {
  LeaveBalancesResponse,
  TimeOffCommentResponse,
  TimeOffRequestPageResponse,
  TimeOffRequestResponse,
} from './dto/time-off.response';
import {
  toLeaveBalancesResponse,
  toTimeOffCommentResponse,
  toTimeOffRequestPageResponse,
  toTimeOffRequestResponse,
} from './mapper/time-off.mapper';

/** The caller's own time off (employees and managers). Admins have no employee record → 404. */
@ApiTags('Time off')
@Controller('api/v1/time-off')
export class TimeOffController {
  constructor(
    private readonly timeOffService: TimeOffService,
    private readonly commentService: TimeOffCommentService,
  ) {}

  @Get('balances')
  @Authorize(can.authenticated)
  @ApiOperation({ summary: "The caller's leave balances in the current cycles" })
  @ZodResponse({ status: HttpStatus.OK, type: LeaveBalancesResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'RESOURCE_NOT_FOUND')
  async balances(@CurrentPrincipal() principal: Principal): Promise<LeaveBalancesResponse> {
    return toLeaveBalancesResponse(await this.timeOffService.findOwnBalances(principal.userId));
  }

  @Get('requests')
  @Authorize(can.authenticated)
  @ApiOperation({
    summary:
      "The caller's time-off requests, newest first, with their history; optionally only pending ones and those changed since an instant",
  })
  @ApiPageable(TIME_OFF_REQUEST_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: TimeOffRequestPageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'RESOURCE_NOT_FOUND',
  )
  async requests(
    @Query() query: TimeOffRequestFilterQuery,
    @CurrentPrincipal() principal: Principal,
    @PageableQuery(TIME_OFF_REQUEST_PAGEABLE) pageable: Pageable<TimeOffRequestSortField>,
  ): Promise<TimeOffRequestPageResponse> {
    return toTimeOffRequestPageResponse(
      await this.timeOffService.findOwnRequests(
        principal.userId,
        query.changedSince ? new Date(query.changedSince) : undefined,
        pageable,
      ),
    );
  }

  @Post('requests')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.authenticated)
  @Idempotent()
  @ApiOperation({ summary: 'Request time off; it waits for a responsible person to decide' })
  @ZodResponse({ status: HttpStatus.OK, type: TimeOffRequestResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'RESOURCE_NOT_FOUND',
    'IDEMPOTENCY_KEY_REUSED',
    'BUSINESS_RULE_VIOLATION',
  )
  async create(
    @Body() request: CreateTimeOffRequestRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<TimeOffRequestResponse> {
    return toTimeOffRequestResponse(
      await this.timeOffService.create(principal.userId, {
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        note: request.note,
      }),
    );
  }

  @Post('requests/:requestId/cancel')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.cancelOwnTimeOffRequest)
  @IdempotencyExempt('Canceling a canceled request changes nothing')
  @ApiOperation({ summary: 'Cancel own request: pending, or approved and not started' })
  @ZodResponse({ status: HttpStatus.OK, type: TimeOffRequestResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONCURRENT_MODIFICATION',
    'BUSINESS_RULE_VIOLATION',
  )
  async cancel(
    @UuidParam('requestId') requestId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<TimeOffRequestResponse> {
    return toTimeOffRequestResponse(await this.timeOffService.cancel(principal.userId, requestId));
  }

  @Post('requests/:requestId/comments')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.commentOwnTimeOffRequest)
  @Idempotent()
  @ApiOperation({ summary: 'Comment on own request; the admins see it' })
  @ZodResponse({ status: HttpStatus.OK, type: TimeOffCommentResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'IDEMPOTENCY_KEY_REUSED',
  )
  async comment(
    @UuidParam('requestId') requestId: string,
    @Body() request: AddTimeOffCommentRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<TimeOffCommentResponse> {
    return toTimeOffCommentResponse(
      await this.commentService.add(requestId, request.body, principal.userId),
    );
  }
}
