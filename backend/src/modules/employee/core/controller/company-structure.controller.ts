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
import { CompanyStructureService } from '../service/company-structure.service';
import {
  CreateDepartmentRequest,
  CreatePositionRequest,
  RenameDepartmentRequest,
  RenamePositionRequest,
} from './dto/company-structure.request';
import {
  CompanyStructureResponse,
  DepartmentResponse,
  StructurePositionResponse,
} from './dto/company-structure.response';
import {
  toCompanyStructureResponse,
  toDepartmentResponse,
  toStructurePositionResponse,
} from './mapper/company-structure.mapper';

const READ_ERRORS = ['UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN'] as const;

/** The organisation's departments and positions (Settings → Company structure, admins). */
@ApiTags('Company structure')
@Controller('api/v1/structure')
export class CompanyStructureController {
  constructor(private readonly structureService: CompanyStructureService) {}

  @Get()
  @Authorize(can.manageStructure)
  @ApiOperation({ summary: 'Departments in their order, each with its positions and head counts' })
  @ZodResponse({ status: HttpStatus.OK, type: CompanyStructureResponse })
  @ApiErrors(...READ_ERRORS)
  async find(@CurrentPrincipal() principal: Principal): Promise<CompanyStructureResponse> {
    return toCompanyStructureResponse(
      await this.structureService.findAll(principal.organisationId),
    );
  }

  @Post('departments')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageStructure)
  @Idempotent()
  @ApiOperation({ summary: 'Add a department (at the end)' })
  @ZodResponse({ status: HttpStatus.OK, type: DepartmentResponse })
  @ApiErrors('VALIDATION_FAILED', ...READ_ERRORS, 'CONFLICT', 'BUSINESS_RULE_VIOLATION')
  async createDepartment(
    @CurrentPrincipal() principal: Principal,
    @Body() request: CreateDepartmentRequest,
  ): Promise<DepartmentResponse> {
    return toDepartmentResponse(
      await this.structureService.createDepartment(
        principal.organisationId,
        request.name,
        principal.userId,
      ),
    );
  }

  @Put('departments/:departmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageDepartment)
  @ApiOperation({ summary: 'Rename a department' })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    ...READ_ERRORS,
    'RESOURCE_NOT_FOUND',
    'CONFLICT',
    'CONCURRENT_MODIFICATION',
  )
  async renameDepartment(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('departmentId') departmentId: string,
    @Body() request: RenameDepartmentRequest,
  ): Promise<void> {
    await this.structureService.renameDepartment(
      principal.organisationId,
      departmentId,
      request,
      principal.userId,
    );
  }

  @Delete('departments/:departmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageDepartment)
  @ApiOperation({ summary: 'Remove a department that has no positions' })
  @ApiErrors('INVALID_PARAMETER', ...READ_ERRORS, 'RESOURCE_NOT_FOUND', 'BUSINESS_RULE_VIOLATION')
  async removeDepartment(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('departmentId') departmentId: string,
  ): Promise<void> {
    await this.structureService.removeDepartment(principal.organisationId, departmentId);
  }

  @Post('departments/:departmentId/positions')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageDepartment)
  @Idempotent()
  @ApiOperation({ summary: 'Add a position to a department' })
  @ZodResponse({ status: HttpStatus.OK, type: StructurePositionResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    ...READ_ERRORS,
    'RESOURCE_NOT_FOUND',
    'CONFLICT',
    'BUSINESS_RULE_VIOLATION',
  )
  async createPosition(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('departmentId') departmentId: string,
    @Body() request: CreatePositionRequest,
  ): Promise<StructurePositionResponse> {
    return toStructurePositionResponse(
      await this.structureService.createPosition(
        principal.organisationId,
        departmentId,
        request.title,
        principal.userId,
      ),
    );
  }

  @Put('positions/:positionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.managePosition)
  @ApiOperation({ summary: 'Rename a position (everyone holding it shows the new title)' })
  @ApiErrors(
    'VALIDATION_FAILED',
    'INVALID_PARAMETER',
    ...READ_ERRORS,
    'RESOURCE_NOT_FOUND',
    'CONFLICT',
    'CONCURRENT_MODIFICATION',
  )
  async renamePosition(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('positionId') positionId: string,
    @Body() request: RenamePositionRequest,
  ): Promise<void> {
    await this.structureService.renamePosition(
      principal.organisationId,
      positionId,
      request,
      principal.userId,
    );
  }

  @Delete('positions/:positionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.managePosition)
  @ApiOperation({ summary: 'Remove a position nobody holds (current or former employees)' })
  @ApiErrors('INVALID_PARAMETER', ...READ_ERRORS, 'RESOURCE_NOT_FOUND', 'BUSINESS_RULE_VIOLATION')
  async removePosition(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('positionId') positionId: string,
  ): Promise<void> {
    await this.structureService.removePosition(principal.organisationId, positionId);
  }
}
