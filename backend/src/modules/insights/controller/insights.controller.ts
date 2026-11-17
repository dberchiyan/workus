import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { Feature } from '../../../common/plan/plan';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { RequiresFeature } from '../../../common/security/plan.guard';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import { InsightsService } from '../service/insights.service';
import { InsightsResponse } from './dto/insights.response';
import { InsightsFilterQuery } from './dto/insights-filter.query';
import { toInsightsResponse } from './mapper/insights.mapper';

/** Company figures for one year, for the whole company or one position category (admin). */
@ApiTags('Insights')
@Controller('api/v1/insights')
export class InsightsController {
    constructor(private readonly insightsService: InsightsService) {}

    @Get()
    @Authorize(can.viewInsights)
    @RequiresFeature(Feature.INSIGHTS)
    @ApiOperation({
        summary: 'Every figure for one year: headcount by month, tenure, turnover, absence leaders, average salary',
    })
    @ZodResponse({ status: HttpStatus.OK, type: InsightsResponse })
    @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN', 'PLAN_UPGRADE_REQUIRED')
    async insights(
        @CurrentPrincipal() principal: Principal,
        @Query() query: InsightsFilterQuery,
    ): Promise<InsightsResponse> {
        return toInsightsResponse(await this.insightsService.overview(principal.organisationId, query));
    }
}
