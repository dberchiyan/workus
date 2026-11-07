import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { UuidParam } from '../../../common/dto/uuid-param';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { Idempotent } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize } from '../../../common/security/security.decorators';
import { HolidayService } from '../service/holiday.service';
import {
  CreateHolidayRequest,
  HolidayYearQuery,
  UpdateHolidayRequest,
} from './dto/holiday.request';
import { HolidayListResponse, HolidayResponse } from './dto/holiday.response';
import { toHolidayResponse } from './mapper/holiday.mapper';

const WRITE_ERRORS = [
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'CONFLICT',
] as const;

/** Company holidays: everyone reads them; admins keep them (Settings → Holidays). */
@ApiTags('Holidays')
@Controller('api/v1/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @Authorize(can.viewHolidays)
  @ApiOperation({ summary: 'The company holidays of one year, by date' })
  @ZodResponse({ status: HttpStatus.OK, type: HolidayListResponse })
  @ApiErrors('VALIDATION_FAILED', 'UNAUTHORIZED', 'SESSION_EXPIRED')
  async list(
    @CurrentPrincipal() principal: Principal,
    @Query() query: HolidayYearQuery,
  ): Promise<HolidayListResponse> {
    return {
      content: (await this.holidayService.findYear(principal.organisationId, query.year)).map(
        toHolidayResponse,
      ),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Authorize(can.manageHolidays)
  @Idempotent()
  @ApiOperation({
    summary: 'Add a holiday; held requests covering it give back a working day',
  })
  @ZodResponse({ status: HttpStatus.OK, type: HolidayResponse })
  @ApiErrors(...WRITE_ERRORS)
  async create(
    @Body() request: CreateHolidayRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<HolidayResponse> {
    return toHolidayResponse(
      await this.holidayService.create(principal.organisationId, request, principal.userId),
    );
  }

  @Put(':holidayId')
  @Authorize(can.manageHoliday)
  @ApiOperation({ summary: 'Change a holiday’s date, name or whether it repeats every year' })
  @ZodResponse({ status: HttpStatus.OK, type: HolidayResponse })
  @ApiErrors(...WRITE_ERRORS, 'INVALID_PARAMETER', 'RESOURCE_NOT_FOUND', 'CONCURRENT_MODIFICATION')
  async update(
    @UuidParam('holidayId') holidayId: string,
    @Body() request: UpdateHolidayRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<HolidayResponse> {
    return toHolidayResponse(
      await this.holidayService.update(
        principal.organisationId,
        holidayId,
        request,
        principal.userId,
      ),
    );
  }

  @Delete(':holidayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.manageHoliday)
  @ApiOperation({ summary: 'Remove a holiday; held requests covering it take the day again' })
  @ApiErrors(
    'INVALID_PARAMETER',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'RESOURCE_NOT_FOUND',
  )
  async remove(
    @CurrentPrincipal() principal: Principal,
    @UuidParam('holidayId') holidayId: string,
  ): Promise<void> {
    await this.holidayService.remove(principal.organisationId, holidayId);
  }
}
