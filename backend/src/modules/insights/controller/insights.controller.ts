import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import type { Principal } from '../../../common/security/principal';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { InsightsService } from '../service/insights.service';
import { InsightsFilterQuery } from './dto/insights-filter.query';
import { InsightsResponse } from './dto/insights.response';
import { toInsightsResponse } from './mapper/insights.mapper';

/** Company figures for one year, for the whole company or one position category (admin). */
@ApiTags('Insights')
@Controller('api/v1/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @Authorize(can.viewInsights)
  @ApiOperation({
    summary:
      'Every figure for one year: headcount by month, tenure, turnover, absence leaders, average salary',
  })
  @ZodResponse({ status: HttpStatus.OK, type: InsightsResponse })
  @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async insights(
    @CurrentPrincipal() principal: Principal,
    @Query() query: InsightsFilterQuery,
  ): Promise<InsightsResponse> {
    return toInsightsResponse(await this.insightsService.overview(principal.organisationId, query));
  }
}
