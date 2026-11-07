import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { InsightsService } from '../service/insights.service';
import { InsightsFilterQuery } from './dto/insights-filter.query';
import {
  AbsenceResponse,
  HeadcountResponse,
  SalaryResponse,
  TenureResponse,
  TurnoverResponse,
} from './dto/insights.response';
import {
  toAbsenceResponse,
  toHeadcountResponse,
  toSalaryResponse,
  toTenureResponse,
  toTurnoverResponse,
} from './mapper/insights.mapper';

const ERRORS = ['VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN'] as const;

/** Company figures for one year, for the whole company or one position category (admin). */
@ApiTags('Insights')
@Controller('api/v1/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('headcount')
  @Authorize(can.viewInsights)
  @ApiOperation({ summary: 'People employed at the end of each month, by category or position' })
  @ZodResponse({ status: HttpStatus.OK, type: HeadcountResponse })
  @ApiErrors(...ERRORS)
  async headcount(@Query() query: InsightsFilterQuery): Promise<HeadcountResponse> {
    return toHeadcountResponse(await this.insightsService.headcount(query));
  }

  @Get('tenure')
  @Authorize(can.viewInsights)
  @ApiOperation({ summary: 'Average months worked by the people employed at the end of the year' })
  @ZodResponse({ status: HttpStatus.OK, type: TenureResponse })
  @ApiErrors(...ERRORS)
  async tenure(@Query() query: InsightsFilterQuery): Promise<TenureResponse> {
    return toTenureResponse(await this.insightsService.tenure(query));
  }

  @Get('turnover')
  @Authorize(can.viewInsights)
  @ApiOperation({ summary: 'Starts and leaves per month, with the people, and the turnover rate' })
  @ZodResponse({ status: HttpStatus.OK, type: TurnoverResponse })
  @ApiErrors(...ERRORS)
  async turnover(@Query() query: InsightsFilterQuery): Promise<TurnoverResponse> {
    return toTurnoverResponse(await this.insightsService.turnover(query));
  }

  @Get('absence')
  @Authorize(can.viewInsights)
  @ApiOperation({ summary: 'The ten people with the most approved days off, and the average' })
  @ZodResponse({ status: HttpStatus.OK, type: AbsenceResponse })
  @ApiErrors(...ERRORS)
  async absence(@Query() query: InsightsFilterQuery): Promise<AbsenceResponse> {
    return toAbsenceResponse(await this.insightsService.absence(query));
  }

  @Get('salary')
  @Authorize(can.viewInsights)
  @ApiOperation({ summary: 'Average monthly salary by category or position, and overall' })
  @ZodResponse({ status: HttpStatus.OK, type: SalaryResponse })
  @ApiErrors(...ERRORS)
  async salary(@Query() query: InsightsFilterQuery): Promise<SalaryResponse> {
    return toSalaryResponse(await this.insightsService.salary(query));
  }
}
