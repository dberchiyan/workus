import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { IdempotencyExempt } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import type { CompanySortField, CompanyUserSortField } from '../service/company-sort';
import { CompanyService } from '../service/company.service';
import {
  COMPANY_PAGEABLE,
  COMPANY_USER_PAGEABLE,
  CompanyCountsResponse,
  CompanyFilterQuery,
  CompanyPageResponse,
  CompanyResponse,
  CompanyUserPageResponse,
  CompanyUserQuery,
  RejectCompanyRequest,
} from './dto/company.response';
import { toCompanyResponse, toCompanyUser } from './mapper/company.mapper';

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** Workus platform administration: every company, its people (directory only) and approval. */
@ApiTags('Platform')
@Controller('api/v1/platform/organisations')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Authorize(can.platformAdmin)
  @ApiOperation({ summary: 'List companies in one status (platform admins)' })
  @ApiPageable(COMPANY_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: CompanyPageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async list(
    @Query() query: CompanyFilterQuery,
    @PageableQuery(COMPANY_PAGEABLE) pageable: Pageable<CompanySortField>,
  ): Promise<CompanyPageResponse> {
    const page = await this.companyService.findPage(
      { status: query.status, search: query.search },
      pageable,
    );
    return { content: page.content.map(toCompanyResponse), totalElements: page.totalElements };
  }

  // Declared before ":organisationId", so it never captures "counts".
  @Get('counts')
  @Authorize(can.platformAdmin)
  @ApiOperation({ summary: 'How many companies wait, are active, or were rejected' })
  @ZodResponse({ status: HttpStatus.OK, type: CompanyCountsResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  counts(): Promise<CompanyCountsResponse> {
    return this.companyService.counts();
  }

  @Get(':organisationId')
  @Authorize(can.manageCompany)
  @ApiOperation({ summary: 'One company with its owners, size and the latest decision' })
  @ZodResponse({ status: HttpStatus.OK, type: CompanyResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async find(@UuidParam('organisationId') organisationId: string): Promise<CompanyResponse> {
    return toCompanyResponse(await this.companyService.find(organisationId));
  }

  @Get(':organisationId/users')
  @Authorize(can.manageCompany)
  @ApiOperation({ summary: "A company's people — name, email, role, status only" })
  @ApiPageable(COMPANY_USER_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: CompanyUserPageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async people(
    @UuidParam('organisationId') organisationId: string,
    @Query() query: CompanyUserQuery,
    @PageableQuery(COMPANY_USER_PAGEABLE) pageable: Pageable<CompanyUserSortField>,
  ): Promise<CompanyUserPageResponse> {
    const page = await this.companyService.findPeople(
      organisationId,
      { people: query.people ?? null, search: query.search },
      pageable,
    );
    const today = todayUtc();
    return {
      content: page.content.map((user) => toCompanyUser(user, today)),
      totalElements: page.totalElements,
    };
  }

  @Post(':organisationId/approval')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageCompany)
  @IdempotencyExempt('Approving an approved company changes nothing')
  @ApiOperation({ summary: 'Approve a waiting (or rejected) company: its people can work in it' })
  @ZodResponse({ status: HttpStatus.OK, type: CompanyResponse })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONCURRENT_MODIFICATION',
  )
  async approve(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('organisationId') organisationId: string,
  ): Promise<CompanyResponse> {
    return toCompanyResponse(await this.companyService.approve(principal, organisationId));
  }

  @Post(':organisationId/rejection')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageCompany)
  @IdempotencyExempt('Rejecting a rejected company changes nothing')
  @ApiOperation({ summary: 'Reject a waiting company, saying why (its owner sees the reason)' })
  @ZodResponse({ status: HttpStatus.OK, type: CompanyResponse })
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
  async reject(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('organisationId') organisationId: string,
    @Body() request: RejectCompanyRequest,
  ): Promise<CompanyResponse> {
    return toCompanyResponse(
      await this.companyService.reject(principal, organisationId, request.reason),
    );
  }
}
