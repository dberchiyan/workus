import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { ReviewService } from '../service/review.service';
import { CreateReviewRequest, UpdateReviewRequest } from './dto/create-review.request';
import { EmployeeReviewsResponse, ReviewResponse } from './dto/review.response';
import { toEmployeeReviewsResponse, toReviewResponse } from './mapper/review.mapper';

@ApiTags('Reviews')
@Controller('api/v1/employees/:employeeId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @Authorize(can.viewEmployeeReviews)
  @ApiOperation({ summary: "List an employee's reviews with the salary history" })
  @ZodResponse({ status: HttpStatus.OK, type: EmployeeReviewsResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async list(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('employeeId') employeeId: string,
  ): Promise<EmployeeReviewsResponse> {
    return toEmployeeReviewsResponse(
      await this.reviewService.findForEmployee(principal.organisationId, employeeId),
    );
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageEmployeeReviews)
  @Idempotent()
  @ApiOperation({ summary: 'Add a review (with salary and feedback) to an employee' })
  @ZodResponse({ status: HttpStatus.OK, type: ReviewResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'IDEMPOTENCY_KEY_REUSED',
    'BUSINESS_RULE_VIOLATION',
  )
  async create(
    @UuidParam('employeeId') employeeId: string,
    @Body() request: CreateReviewRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ReviewResponse> {
    const review = await this.reviewService.create(
      principal.organisationId,
      employeeId,
      toCommand(request),
      principal.userId,
    );
    return toReviewResponse(review);
  }

  @Get(':reviewId')
  @Authorize(can.accessEmployeeReview)
  @ApiOperation({ summary: 'Return one review of the employee' })
  @ZodResponse({ status: HttpStatus.OK, type: ReviewResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async findOne(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('employeeId') _employeeId: string,
    @UuidParam('reviewId') reviewId: string,
  ): Promise<ReviewResponse> {
    return toReviewResponse(await this.reviewService.findOne(principal.organisationId, reviewId));
  }

  @Put(':reviewId')
  @Authorize(can.accessEmployeeReview)
  @ApiOperation({ summary: 'Update a review; the version must match the one read' })
  @ZodResponse({ status: HttpStatus.OK, type: ReviewResponse })
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
  async update(
    @UuidParam('employeeId') employeeId: string,
    @UuidParam('reviewId') reviewId: string,
    @Body() request: UpdateReviewRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ReviewResponse> {
    const review = await this.reviewService.update(
      principal.organisationId,
      employeeId,
      reviewId,
      { ...toCommand(request), version: request.version },
      principal.userId,
    );
    return toReviewResponse(review);
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.accessEmployeeReview)
  @ApiOperation({ summary: 'Delete a review (its salary leaves the history)' })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'BUSINESS_RULE_VIOLATION',
  )
  async remove(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('employeeId') employeeId: string,
    @UuidParam('reviewId') reviewId: string,
  ): Promise<void> {
    await this.reviewService.delete(principal.organisationId, employeeId, reviewId);
  }
}

/** Request → command, field by field (never the DTO itself). */
const toCommand = (request: CreateReviewRequest) => ({
  title: request.title,
  date: request.date,
  status: request.status,
  salary: request.salary,
  responsibleUserIds: request.responsibleUserIds,
  feedback: {
    hr: request.feedback.hr,
    teamLead: request.feedback.teamLead,
    team: request.feedback.team,
    client: request.feedback.client,
  },
});
