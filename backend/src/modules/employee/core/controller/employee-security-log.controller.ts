import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { ApiPageable, type Pageable, PageableQuery } from '../../../../common/dto/pageable';
import { SecurityLogQuery, toSecurityEventPage } from '../../../../common/dto/security-event.response';
import { UuidParam } from '../../../../common/dto/uuid-param';
import { ApiErrors } from '../../../../common/exception/api-errors.decorator';
import { Feature } from '../../../../common/plan/plan';
import { CurrentPrincipal } from '../../../../common/security/current-principal.decorator';
import { RequiresFeature } from '../../../../common/security/plan.guard';
import { can } from '../../../../common/security/policies';
import type { Principal } from '../../../../common/security/principal';
import { Authorize } from '../../../../common/security/security.decorators';
import { AUDIT_EVENT_PAGEABLE, type AuditEventSortField } from '../../../audit/service/audit-sort';
import { EmployeeService } from '../service/employee.service';
import { EmployeeSecurityLogResponse } from './dto/employee-security-log.response';
import { toSecurityLogCsv } from './mapper/employee-export.mapper';

@ApiTags('Employees')
@Controller('api/v1/employees/:employeeId/security-log')
export class EmployeeSecurityLogController {
    constructor(private readonly employeeService: EmployeeService) {}

    @Get()
    @Authorize(can.viewEmployeeActivity)
    @ApiOperation({
        summary: "An employee's security log (sign-ins, password changes, ended sessions), newest first",
    })
    @ApiPageable(AUDIT_EVENT_PAGEABLE)
    @ZodResponse({ status: HttpStatus.OK, type: EmployeeSecurityLogResponse })
    @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN', 'RESOURCE_NOT_FOUND')
    async list(
        @CurrentPrincipal() principal: Principal,
        @UuidParam('employeeId') employeeId: string,
        @Query() query: SecurityLogQuery,
        @PageableQuery(AUDIT_EVENT_PAGEABLE) pageable: Pageable<AuditEventSortField>,
    ): Promise<EmployeeSecurityLogResponse> {
        return toSecurityEventPage(
            await this.employeeService.findSecurityLog(
                principal.organisationId,
                employeeId,
                query.category ?? null,
                pageable,
            ),
        );
    }

    @Get('export')
    @Authorize(can.viewEmployeeActivity)
    @RequiresFeature(Feature.EXPORTS)
    @ApiOperation({ summary: "Download an employee's whole security log as CSV (Business plan)" })
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
        const events = await this.employeeService.findAllSecurityLog(principal.organisationId, employeeId);
        response
            .type('text/csv; charset=utf-8')
            .attachment(`security-log-${employeeId}.csv`)
            .send(toSecurityLogCsv(events));
    }
}
