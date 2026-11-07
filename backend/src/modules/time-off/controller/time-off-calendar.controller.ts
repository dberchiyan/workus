import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import type { Principal } from '../../../common/security/principal';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { can } from '../../../common/security/policies';
import { Authorize } from '../../../common/security/security.decorators';
import { CALENDAR_PAGEABLE, type CalendarSortField } from '../service/time-off-sort';
import { TimeOffService } from '../service/time-off.service';
import { TimeOffCalendarQuery } from './dto/time-off-calendar.query';
import { TimeOffCalendarResponse } from './dto/time-off.response';
import { toTimeOffCalendarResponse } from './mapper/time-off.mapper';

/** The company's time-off calendar — every signed-in user sees everyone's. */
@ApiTags('Time off')
@Controller('api/v1/time-off/calendar')
export class TimeOffCalendarController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Get()
  @Authorize(can.viewTimeOffCalendar)
  @ApiOperation({
    summary:
      'One month: people employed in it, by name, with their approved and pending requests of the chosen types',
  })
  @ApiPageable(CALENDAR_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: TimeOffCalendarResponse })
  @ApiErrors('VALIDATION_FAILED', 'INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED')
  async calendar(
    @CurrentPrincipal() principal: Principal,
    @Query() query: TimeOffCalendarQuery,
    @PageableQuery(CALENDAR_PAGEABLE) pageable: Pageable<CalendarSortField>,
  ): Promise<TimeOffCalendarResponse> {
    const [year = 0, month = 0] = query.month.split('-').map(Number);
    return toTimeOffCalendarResponse(
      await this.timeOffService.calendar(
        principal.organisationId,
        { year, month, types: query.types, search: query.search },
        pageable,
      ),
    );
  }
}
