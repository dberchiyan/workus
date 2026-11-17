import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';

import type { Pageable } from '../../../common/dto/pageable';
import {
    BusinessRuleException,
    ConcurrentModificationException,
    ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import { DAYS_PER_WEEK } from '../../../common/time/units';
import { AuditService } from '../../audit/service/audit.service';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { EmployeeService } from '../../employee/core/service/employee.service';
import type { EmployeeForTimeOff } from '../../employee/core/service/employee.types';
import { NotificationType } from '../../notification/service/notification-type';
import type { TimeOffRequestRecord } from '../repository/record/time-off-request.record';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { HolidayService } from './holiday.service';
import { cycleOf, LEAVE_POLICY, plusDays, todayUtc, workingDaysBetween } from './leave-policy';
import type {
    AbsentPerson,
    CreateTimeOffCommand,
    DashboardRequests,
    LeaveBalance,
    TimeOffCalendar,
    TimeOffOverview,
    TimeOffRequestPage,
    TimeOffRequestView,
} from './time-off.types';
import { timeOffLabel } from './time-off-label';
import { TimeOffNotifier } from './time-off-notifier';
import type { CalendarSortField, TimeOffRequestSortField } from './time-off-sort';
import { isTimeOffStatus, isTimeOffType, TIME_OFF_TYPES, TimeOffStatus, TimeOffType } from './time-off-type';

const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

const OUT_TODAY_SHOWN = 5;

/** A pending request, or an approved one that has not started, can still be canceled. */
const isCancelable = (request: { status: string; startsAt: Date }, today: Date): boolean =>
    request.status === TimeOffStatus.PENDING || (request.status === TimeOffStatus.APPROVED && request.startsAt > today);

@Injectable()
export class TimeOffService {
    constructor(
        private readonly requestRepository: TimeOffRequestRepository,
        private readonly employeeService: EmployeeService,
        private readonly auditService: AuditService,
        private readonly holidayService: HolidayService,
        private readonly notifier: TimeOffNotifier,
    ) {}

    /**
     * The month calendar: people employed in it (by name, paged) with their approved and pending
     * requests of the given types. Every signed-in user sees everyone's (product decision).
     */
    async calendar(
        organisationId: string,
        query: {
            year: number;
            month: number;
            types: readonly TimeOffType[];
            search: string | undefined;
        },
        pageable: Pageable<CalendarSortField>,
    ): Promise<TimeOffCalendar> {
        const from = new Date(Date.UTC(query.year, query.month - 1, 1));
        const to = new Date(Date.UTC(query.year, query.month, 0));
        const [people, holidays] = await Promise.all([
            this.employeeService.findCalendarPage(organisationId, query.search, from, to, pageable),
            this.holidayService.daysBetween(organisationId, from, to),
        ]);
        const requests = await this.requestRepository.findCalendarRequests(
            organisationId,
            people.content.map((employee) => employee.id),
            from,
            to,
            query.types,
        );
        return {
            from,
            to,
            holidays,
            content: people.content.map((employee) => ({
                employee,
                requests: requests.filter((request) => request.employeeId === employee.id),
            })),
            totalElements: people.totalElements,
        };
    }

    /**
     * For other modules (insights): approved working days per employee and type in [from, to]
     * (each request clipped to the range).
     */
    async approvedDaysBetween(
        organisationId: string,
        from: Date,
        to: Date,
    ): Promise<{ employeeId: string; type: TimeOffType; days: number }[]> {
        const [requests, holidays] = await Promise.all([
            this.requestRepository.findApprovedWithTypeOverlapping(organisationId, from, to),
            this.holidayService.datesBetween(organisationId, from, to),
        ]);
        return requests.map((request) => ({
            employeeId: request.employeeId,
            type: isTimeOffType(request.type) ? request.type : TimeOffType.DAY_OFF,
            days: workingDaysBetween(
                request.startsAt > from ? request.startsAt : from,
                request.endsAt < to ? request.endsAt : to,
                holidays,
            ),
        }));
    }

    /** For other modules (dashboard): requests made in [from, to), newest first, a page at a time. */
    async requestsCreatedBetween(
        organisationId: string,
        from: Date,
        to: Date,
        pageRequest: { page: number; size: number },
    ): Promise<DashboardRequests> {
        const page = await this.requestRepository.findCreatedBetween(organisationId, from, to, {
            offset: pageRequest.page * pageRequest.size,
            limit: pageRequest.size,
        });
        return {
            content: page.content.map((request) => ({
                id: request.id,
                type: isTimeOffType(request.type) ? request.type : TimeOffType.DAY_OFF,
                status: isTimeOffStatus(request.status) ? request.status : TimeOffStatus.PENDING,
                startsAt: request.startsAt,
                endsAt: request.endsAt,
                days: request.days,
                createdAt: request.createdAt,
                employee: {
                    id: request.employee.id,
                    userId: request.employee.user.id,
                    firstName: request.employee.user.firstName,
                    lastName: request.employee.user.lastName,
                    positionTitle: request.employee.position.title,
                },
            })),
            totalElements: page.totalElements,
        };
    }

    /** The caller's balances; 404 when the caller has no employee record (admins). */
    async findOwnBalances(organisationId: string, userId: string): Promise<LeaveBalance[]> {
        return this.balancesOf(organisationId, await this.requireSelf(userId), todayUtc());
    }

    /** One employee's balances (admin). */
    async findBalances(organisationId: string, employeeId: string): Promise<LeaveBalance[]> {
        const employee = await this.employeeService.findForTimeOff(organisationId, employeeId);
        if (!employee) {
            throw new ResourceNotFoundException();
        }
        return this.balancesOf(organisationId, employee, todayUtc());
    }

    /** For other modules (dashboard): pending requests and who is off today / this week. */
    async overview(organisationId: string, today: Date): Promise<TimeOffOverview> {
        const weekEnd = plusDays(today, (DAYS_PER_WEEK - today.getUTCDay()) % DAYS_PER_WEEK);
        const [pending, absences] = await Promise.all([
            this.requestRepository.pendingSummary(organisationId),
            this.requestRepository.findApprovedOverlapping(organisationId, today, weekEnd),
        ]);
        const offToday = new Map<string, AbsentPerson>();
        const offLater = new Set<string>();
        for (const absence of absences) {
            if (absence.startsAt <= today && absence.endsAt >= today) {
                offToday.set(absence.employeeId, absence.employee.user);
            } else {
                offLater.add(absence.employeeId);
            }
        }
        const outToday = [...offToday.values()].sort((left, right) =>
            `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`),
        );
        return {
            pendingCount: pending.count,
            oldestPendingCreatedAt: pending.oldestCreatedAt,
            outToday: outToday.slice(0, OUT_TODAY_SHOWN),
            outTodayCount: outToday.length,
            outLaterThisWeekCount: [...offLater].filter((id) => !offToday.has(id)).length,
        };
    }

    /** The caller's requests, newest first, each with its history. */
    async findOwnRequests(
        organisationId: string,
        userId: string,
        changedSince: Date | undefined,
        pageable: Pageable<TimeOffRequestSortField>,
    ): Promise<TimeOffRequestPage> {
        const employee = await this.requireSelf(userId);
        const page = await this.requestRepository.findPageByEmployee(
            organisationId,
            employee.id,
            changedSince,
            pageable,
        );
        return {
            content: await this.withHistory(organisationId, page.content),
            totalElements: page.totalElements,
        };
    }

    /**
     * Request time off: working days > 0, within employment, no overlap with a pending or approved
     * request, within the balance of the cycle of its first day (vacation, sick days). Decided by
     * the employee's responsible people, so the employee needs at least one.
     */
    @Transactional()
    async create(organisationId: string, userId: string, command: CreateTimeOffCommand): Promise<TimeOffRequestView> {
        const employee = await this.requireSelf(userId);
        const startsAt = asDate(command.startsAt);
        const endsAt = asDate(command.endsAt);
        if (startsAt < employee.startsAt) {
            throw new BusinessRuleException('errors.timeOff.beforeStart', {}, 'startsAt');
        }
        if (employee.terminatedAt && endsAt >= employee.terminatedAt) {
            throw new BusinessRuleException('errors.timeOff.afterTermination', {}, 'endsAt');
        }
        const days = workingDaysBetween(
            startsAt,
            endsAt,
            await this.holidayService.datesBetween(organisationId, startsAt, endsAt),
        );
        if (days === 0) {
            throw new BusinessRuleException('errors.timeOff.noWorkingDays', {}, 'endsAt');
        }
        if (await this.requestRepository.existsHeldOverlapping(organisationId, employee.id, startsAt, endsAt)) {
            throw new BusinessRuleException('errors.timeOff.overlaps', {}, 'startsAt');
        }
        const balance = (await this.balancesOf(organisationId, employee, startsAt)).find(
            (item) => item.type === command.type,
        );
        if (balance?.available !== null && balance !== undefined && days > balance.available) {
            throw new BusinessRuleException(
                'errors.timeOff.notEnoughDays',
                { available: balance.available, requested: days },
                'endsAt',
            );
        }
        if (employee.responsibleUserIds.length === 0) {
            throw new BusinessRuleException('errors.timeOff.noResponsible');
        }
        const request = await this.requestRepository.create({
            organisationId,
            employeeId: employee.id,
            type: command.type,
            startsAt,
            endsAt,
            days,
            note: command.note ?? null,
            responsibleUserIds: employee.responsibleUserIds,
            createdBy: userId,
        });
        await this.auditService.record({
            action: AuditAction.TIME_OFF_REQUEST_CREATED,
            employeeId: employee.id,
            target: {
                type: AuditTargetType.TIME_OFF_REQUEST,
                id: request.id,
                label: timeOffLabel(request),
            },
            changes: [
                ...changeOf(AuditField.TIME_OFF_TYPE, null, auditValue.timeOffType(request.type)),
                ...changeOf(AuditField.PERIOD_STARTS_AT, null, auditValue.date(request.startsAt)),
                ...changeOf(AuditField.PERIOD_ENDS_AT, null, auditValue.date(request.endsAt)),
                ...changeOf(AuditField.DAYS, null, auditValue.number(request.days)),
                ...(request.note ? changeOf(AuditField.NOTE, null, auditValue.text(request.note)) : []),
            ],
        });
        await this.notifier.notify(
            organisationId,
            request.id,
            NotificationType.TIME_OFF_REQUESTED,
            userId,
            'responsibles',
        );
        const [view] = await this.withHistory(organisationId, [request]);
        if (!view) {
            throw new Error('Created request lost its view');
        }
        return view;
    }

    /** The policy has checked the request is the caller's. Pending, or approved and not started. */
    @Transactional()
    async cancel(organisationId: string, userId: string, requestId: string): Promise<TimeOffRequestView> {
        const request = await this.requestRepository.findById(organisationId, requestId);
        if (!request) {
            throw new ResourceNotFoundException();
        }
        if (request.status === TimeOffStatus.CANCELED) {
            return this.viewOf(organisationId, request);
        }
        if (!isCancelable(request, todayUtc())) {
            throw new BusinessRuleException('errors.timeOff.notCancelable');
        }
        if (
            !(await this.requestRepository.changeStatus(
                organisationId,
                requestId,
                request.status,
                TimeOffStatus.CANCELED,
                userId,
            ))
        ) {
            throw new ConcurrentModificationException();
        }
        const employee = await this.requireSelf(userId);
        await this.auditService.record({
            action: AuditAction.TIME_OFF_REQUEST_CANCELED,
            employeeId: employee.id,
            target: {
                type: AuditTargetType.TIME_OFF_REQUEST,
                id: requestId,
                label: timeOffLabel(request),
            },
            changes: changeOf(
                AuditField.STATUS,
                auditValue.timeOffStatus(request.status),
                auditValue.timeOffStatus(TimeOffStatus.CANCELED),
            ),
        });
        await this.notifier.notify(
            organisationId,
            requestId,
            NotificationType.TIME_OFF_WITHDRAWN,
            userId,
            'responsibles',
        );
        const after = await this.requestRepository.findById(organisationId, requestId);
        if (!after) {
            throw new Error('Canceled request not found in the same transaction');
        }
        return this.viewOf(organisationId, after);
    }

    private async viewOf(organisationId: string, request: TimeOffRequestRecord): Promise<TimeOffRequestView> {
        const [view] = await this.withHistory(organisationId, [request]);
        if (!view) {
            throw new Error('Request lost its view');
        }
        return view;
    }

    /** One history query for the whole page. */
    private async withHistory(organisationId: string, requests: TimeOffRequestRecord[]): Promise<TimeOffRequestView[]> {
        const events = await this.auditService.findByTargets(
            organisationId,
            requests.map((request) => request.id),
        );
        const today = todayUtc();
        return requests.map((request) => ({
            request,
            history: events.filter((event) => event.target.id === request.id),
            canCancel: isCancelable(request, today),
        }));
    }

    /** Balances for the cycles that hold `date`; one query for every type. */
    private async balancesOf(
        organisationId: string,
        employee: EmployeeForTimeOff,
        date: Date,
    ): Promise<LeaveBalance[]> {
        const cycles = TIME_OFF_TYPES.map((type) => ({
            type,
            ...cycleOf(employee.startsAt, LEAVE_POLICY[type].cycleMonths, date),
        }));
        const from = new Date(Math.min(...cycles.map((cycle) => cycle.start.getTime())));
        const to = new Date(Math.max(...cycles.map((cycle) => cycle.end.getTime())));
        const held = await this.requestRepository.findHeldStartingBetween(organisationId, employee.id, from, to);
        return cycles.map(({ type, start, end }) => {
            const inCycle = held.filter(
                (request) => request.type === type && request.startsAt >= start && request.startsAt <= end,
            );
            const sum = (status: TimeOffStatus) =>
                inCycle
                    .filter((request) => request.status === status)
                    .reduce((total, request) => total + request.days, 0);
            const used = sum(TimeOffStatus.APPROVED);
            const pending = sum(TimeOffStatus.PENDING);
            const { allowance } = LEAVE_POLICY[type];
            return {
                type,
                cycleStartsAt: start,
                cycleEndsAt: end,
                allowance,
                used,
                pending,
                available: allowance === null ? null : Math.max(0, allowance - used - pending),
            };
        });
    }

    private async requireSelf(userId: string): Promise<EmployeeForTimeOff> {
        const employee = await this.employeeService.findForTimeOffByUserId(userId);
        if (!employee) {
            throw new ResourceNotFoundException();
        }
        return employee;
    }
}
