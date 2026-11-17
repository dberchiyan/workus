import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { PositionCategoryService } from '../service/position-category.service';
import { PositionCategoryCountsResponse } from './dto/employee.response';
import { PositionCategoryFilterQuery } from './dto/employee-filter.query';

@ApiTags('Employees')
@Controller('api/v1/position-categories')
export class PositionCategoryController {
    constructor(private readonly positionCategoryService: PositionCategoryService) {}

    @Get()
    @Authorize(can.viewEmployees)
    @ApiOperation({ summary: 'List position categories with matching employee counts' })
    @ZodResponse({ status: HttpStatus.OK, type: PositionCategoryCountsResponse })
    @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
    list(
        @CurrentPrincipal() principal: Principal,
        @Query() query: PositionCategoryFilterQuery,
    ): Promise<PositionCategoryCountsResponse> {
        return this.positionCategoryService.countEmployees(principal.organisationId, query.search, query.status);
    }
}
