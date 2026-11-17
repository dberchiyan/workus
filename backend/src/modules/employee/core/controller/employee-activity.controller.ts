import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Principal } from '../../../../common/security/principal';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiPageable, type Pageable, PageableQuery } from '../../../../common/dto/pageable';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { can } from '../../../../common/security/policies';
import { Feature } from '../../../../common/plan/plan';
import { RequiresFeature } from '../../../../common/security/plan.guard';
import { Authorize } from '../../../../common/security/security.decorators';
import { AUDIT_EVENT_PAGEABLE, type AuditEventSortField } from '../../../audit/service/audit-sort';
import { EmployeeService } from '../service/employee.service';
import { EmployeeActivityPageResponse } from './dto/employee-activity.response';
import { toEmployeeActivityPageResponse } from './mapper/employee-activity.mapper';
import { toActivityCsv } from './mapper/employee-export.mapper';

@ApiTags('Employees')
@Controller('api/v1/employees/:employeeId/activity')
export class EmployeeActivityController {
    constructor(private readonly employeeService: EmployeeService) {}

    @Get()
    @Authorize(can.viewEmployeeActivity)
    @ApiOperation({
        summary: "List changes made to an employee's records, newest first, with who made them",
    })
    @ApiPageable(AUDIT_EVENT_PAGEABLE)
    @ZodResponse({ status: HttpStatus.OK, type: EmployeeActivityPageResponse })
    @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN', 'RESOURCE_NOT_FOUND')
    async list(
        @CurrentPrincipal() principal: Principal,
        @UuidParam('employeeId') employeeId: string,
        @PageableQuery(AUDIT_EVENT_PAGEABLE) pageable: Pageable<AuditEventSortField>,
    ): Promise<EmployeeActivityPageResponse> {
        return toEmployeeActivityPageResponse(
            await this.employeeService.findActivity(principal.organisationId, employeeId, pageable),
        );
    }

    @Get('export')
    @Authorize(can.viewEmployeeActivity)
    @RequiresFeature(Feature.EXPORTS)
    @ApiOperation({ summary: "Download an employee's whole change history as CSV (Business plan)" })
    @ApiProduces('text/csv')
    @ApiOkResponse({
        description: 'CSV file',
        content: { 'text/csv': { schema: { type: 'string' } } },
    })
    @ApiErrors(
        'INVALID_PARAMETER',
        'UNAUTHORIZED',
        'SESSION_EXPIRED',
        'FORBIDDEN',
        'PLAN_UPGRADE_REQUIRED',
        'RESOURCE_NOT_FOUND',
    )
    async export(
        @CurrentPrincipal() principal: Principal,
        @UuidParam('employeeId') employeeId: string,
        @Res() response: Response,
    ): Promise<void> {
        const events = await this.employeeService.findAllActivity(principal.organisationId, employeeId);
        response.type('text/csv; charset=utf-8').attachment(`activity-${employeeId}.csv`).send(toActivityCsv(events));
    }
}
