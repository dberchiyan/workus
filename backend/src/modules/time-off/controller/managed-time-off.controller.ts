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
import { toSearchTerms } from '../../employee/core/service/filter/employee.criteria';
import { TimeOffDecisionService, type TimeOffDecision } from '../service/time-off-decision.service';
import { MANAGED_REQUEST_PAGEABLE, type ManagedRequestSortField } from '../service/time-off-sort';
import { AddTimeOffCommentRequest } from './dto/add-time-off-comment.request';
import { ManagedTimeOffRequestFilterQuery } from './dto/managed-time-off-request-filter.query';
import {
  ManagedTimeOffRequestPageResponse,
  ManagedTimeOffRequestResponse,
  TimeOffCommentResponse,
} from './dto/time-off.response';
import {
  toManagedTimeOffRequestPageResponse,
  toManagedTimeOffRequestResponse,
  toTimeOffCommentResponse,
} from './mapper/time-off.mapper';

const DECISION_ERRORS = [
  'INVALID_PARAMETER',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'RESOURCE_NOT_FOUND',
  'CONCURRENT_MODIFICATION',
  'BUSINESS_RULE_VIOLATION',
] as const;

/** Every employee's time-off requests (admin): lists, decisions, comments. */
@ApiTags('Time off')
@Controller('api/v1/time-off-requests')
export class ManagedTimeOffController {
  constructor(private readonly decisionService: TimeOffDecisionService) {}

  @Get()
  @Authorize(can.viewTimeOffRequests)
  @ApiOperation({
    summary: 'Pending or closed time-off requests of every employee, with their history',
  })
  @ApiPageable(MANAGED_REQUEST_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: ManagedTimeOffRequestPageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async list(
    @Query() query: ManagedTimeOffRequestFilterQuery,
    @CurrentPrincipal() principal: Principal,
    @PageableQuery(MANAGED_REQUEST_PAGEABLE) pageable: Pageable<ManagedRequestSortField>,
  ): Promise<ManagedTimeOffRequestPageResponse> {
    return toManagedTimeOffRequestPageResponse(
      await this.decisionService.findPage(
        {
          state: query.state,
          status: query.state === 'CLOSED' ? query.status : undefined,
          type: query.type,
          responsibleUserId: query.mine ? principal.userId : undefined,
          searchTerms: toSearchTerms(query.search),
        },
        pageable,
        principal.userId,
      ),
    );
  }

  @Get(':requestId')
  @Authorize(can.viewTimeOffRequest)
  @ApiOperation({ summary: 'One time-off request with its history and comments' })
  @ZodResponse({ status: HttpStatus.OK, type: ManagedTimeOffRequestResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async findOne(
    @UuidParam('requestId') requestId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ManagedTimeOffRequestResponse> {
    return toManagedTimeOffRequestResponse(
      await this.decisionService.findOne(requestId, principal.userId),
    );
  }

  @Post(':requestId/approval')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.decideTimeOffRequest)
  @IdempotencyExempt('Approving an approved request changes nothing')
  @ApiOperation({ summary: 'Approve a pending request (its responsible people only)' })
  @ZodResponse({ status: HttpStatus.OK, type: ManagedTimeOffRequestResponse })
  @ApiErrors(...DECISION_ERRORS)
  approve(
    @UuidParam('requestId') requestId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ManagedTimeOffRequestResponse> {
    return this.decide(requestId, 'approve', principal);
  }

  @Post(':requestId/rejection')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.decideTimeOffRequest)
  @IdempotencyExempt('Rejecting a rejected request changes nothing')
  @ApiOperation({ summary: 'Reject a pending request (its responsible people only)' })
  @ZodResponse({ status: HttpStatus.OK, type: ManagedTimeOffRequestResponse })
  @ApiErrors(...DECISION_ERRORS)
  reject(
    @UuidParam('requestId') requestId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ManagedTimeOffRequestResponse> {
    return this.decide(requestId, 'reject', principal);
  }

  @Post(':requestId/cancellation')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.decideTimeOffRequest)
  @IdempotencyExempt('Canceling a canceled request changes nothing')
  @ApiOperation({
    summary:
      'Cancel a pending or approved request, even a started one (its responsible people only)',
  })
  @ZodResponse({ status: HttpStatus.OK, type: ManagedTimeOffRequestResponse })
  @ApiErrors(...DECISION_ERRORS)
  cancel(
    @UuidParam('requestId') requestId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ManagedTimeOffRequestResponse> {
    return this.decide(requestId, 'cancel', principal);
  }

  @Post(':requestId/comments')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.commentTimeOffRequest)
  @Idempotent()
  @ApiOperation({ summary: 'Comment on a request; every admin and the employee see it' })
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
      await this.decisionService.comment(requestId, request.body, principal.userId),
    );
  }

  private async decide(
    requestId: string,
    decision: TimeOffDecision,
    principal: Principal,
  ): Promise<ManagedTimeOffRequestResponse> {
    return toManagedTimeOffRequestResponse(
      await this.decisionService.decide(requestId, decision, principal.userId),
    );
  }
}
