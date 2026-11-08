import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { DemoRestricted } from '../../../common/security/demo.guard';
import { Authorize } from '../../../common/security/security.decorators';
import type { AdministratorSortField } from '../../user/service/administrator-sort';
import { OrganisationService } from '../service/organisation.service';
import {
  AddAdministratorRequest,
  AddedAdministratorResponse,
  ADMINISTRATOR_PAGEABLE,
  AdministratorFilterQuery,
  AdministratorPageResponse,
  AdministratorResponse,
  ChangeRoleRequest,
} from './dto/administrator.response';
import { OrganisationResponse, UpdateOrganisationRequest } from './dto/organisation.response';
import {
  toAddedAdministratorResponse,
  toAdministratorResponse,
  toOrganisationResponse,
} from './mapper/organisation.mapper';

/** The caller's own organisation (a user belongs to one — it comes from the session). */
@ApiTags('Organisation')
@Controller('api/v1/organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get()
  @Authorize(can.authenticated)
  @ApiOperation({ summary: "Return the caller's organisation" })
  @ZodResponse({ status: HttpStatus.OK, type: OrganisationResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED')
  async find(@CurrentPrincipal() principal: Principal): Promise<OrganisationResponse> {
    return toOrganisationResponse(await this.organisationService.find(principal.organisationId));
  }

  @Put()
  @Authorize(can.owner)
  @ApiOperation({ summary: "Rename the caller's organisation (owners only)" })
  @ZodResponse({ status: HttpStatus.OK, type: OrganisationResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'CONCURRENT_MODIFICATION',
  )
  async rename(
    @CurrentPrincipal() principal: Principal,
    @Body() request: UpdateOrganisationRequest,
  ): Promise<OrganisationResponse> {
    return toOrganisationResponse(
      await this.organisationService.rename(
        principal.organisationId,
        { name: request.name, version: request.version },
        principal.userId,
      ),
    );
  }

  @Get('administrators')
  @Authorize(can.admin)
  @ApiOperation({ summary: 'List the owners and admins of the organisation' })
  @ApiPageable(ADMINISTRATOR_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: AdministratorPageResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
  )
  async administrators(
    @CurrentPrincipal() principal: Principal,
    @Query() query: AdministratorFilterQuery,
    @PageableQuery(ADMINISTRATOR_PAGEABLE) pageable: Pageable<AdministratorSortField>,
  ): Promise<AdministratorPageResponse> {
    const page = await this.organisationService.administrators(
      principal.organisationId,
      query.search,
      pageable,
    );
    return {
      content: page.content.map(toAdministratorResponse),
      totalElements: page.totalElements,
    };
  }

  @Post('administrators')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.owner)
  @Idempotent({ redact: ['temporaryPassword'] })
  @ApiOperation({
    summary:
      'Add an admin to the organisation with a generated password, returned once (owners only)',
  })
  @ZodResponse({ status: HttpStatus.OK, type: AddedAdministratorResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'CONFLICT',
    'IDEMPOTENCY_KEY_REUSED',
  )
  async addAdministrator(
    @CurrentPrincipal() principal: Principal,
    @Body() request: AddAdministratorRequest,
  ): Promise<AddedAdministratorResponse> {
    return toAddedAdministratorResponse(
      await this.organisationService.addAdministrator(principal, {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
      }),
    );
  }

  @Put('administrators/:userId/role')
  @Authorize(can.manageUserRole)
  @DemoRestricted()
  @ApiOperation({
    summary: 'Make an admin an owner or an owner an admin (owners only); the last owner stays',
  })
  @ZodResponse({ status: HttpStatus.OK, type: AdministratorResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
    'CONCURRENT_MODIFICATION',
    'BUSINESS_RULE_VIOLATION',
    'DEMO_RESTRICTED',
  )
  async changeRole(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('userId') userId: string,
    @Body() request: ChangeRoleRequest,
  ): Promise<AdministratorResponse> {
    return toAdministratorResponse(
      await this.organisationService.changeRole(principal, userId, {
        role: request.role,
        version: request.version,
      }),
    );
  }
}
