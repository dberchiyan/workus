import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import {
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { AuditService } from '../../audit/service/audit.service';
import type { EmployeeForTimeOff } from '../../employee/core/service/employee.types';
import { EmployeeService } from '../../employee/core/service/employee.service';
import type { TimeOffRequestRecord } from '../repository/record/time-off-request.record';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { cycleOf, LEAVE_POLICY, plusDays, todayUtc, workingDaysBetween } from './leave-policy';
import type { CalendarSortField, TimeOffRequestSortField } from './time-off-sort';
import { timeOffLabel } from './time-off-label';
import { TIME_OFF_TYPES, type TimeOffType, TimeOffStatus } from './time-off-type';
import type {
  AbsentPerson,
  CreateTimeOffCommand,
  LeaveBalance,
  TimeOffCalendar,
  TimeOffOverview,
  TimeOffRequestPage,
  TimeOffRequestView,
} from './time-off.types';

const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** Avatars shown on the "Out today" card; the rest is "+N". */
const OUT_TODAY_SHOWN = 5;

/** A pending request, or an approved one that has not started, can still be canceled. */
const isCancelable = (request: { status: string; startDate: Date }, today: Date): boolean =>
  request.status === TimeOffStatus.PENDING ||
  (request.status === TimeOffStatus.APPROVED && request.startDate > today);

@Injectable()
export class TimeOffService {
  constructor(
    private readonly requestRepository: TimeOffRequestRepository,
    private readonly employeeService: EmployeeService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * The month calendar: people employed in it (by name, paged) with their approved and pending
   * requests of the given types. Every signed-in user sees everyone's (product decision).
   */
  async calendar(
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
    const people = await this.employeeService.findCalendarPage(query.search, from, to, pageable);
    const requests = await this.requestRepository.findCalendarRequests(
      people.content.map((employee) => employee.id),
      from,
      to,
      query.types,
    );
    return {
      from,
      to,
      content: people.content.map((employee) => ({
        employee,
        requests: requests.filter((request) => request.employeeId === employee.id),
      })),
      totalElements: people.totalElements,
    };
  }

  /** The caller's balances; 404 when the caller has no employee record (admins). */
  async findOwnBalances(userId: string): Promise<LeaveBalance[]> {
    return this.balancesOf(await this.requireSelf(userId), todayUtc());
  }

  /** One employee's balances (admin). */
  async findBalances(employeeId: string): Promise<LeaveBalance[]> {
    const employee = await this.employeeService.findForTimeOff(employeeId);
    if (!employee) {
      throw new ResourceNotFoundException();
    }
    return this.balancesOf(employee, todayUtc());
  }

  /** For other modules (dashboard): pending requests and who is off today / this week. */
  async overview(today: Date): Promise<TimeOffOverview> {
    const weekEnd = plusDays(today, (7 - today.getUTCDay()) % 7);
    const [pending, absences] = await Promise.all([
      this.requestRepository.pendingSummary(),
      this.requestRepository.findApprovedOverlapping(today, weekEnd),
    ]);
    const offToday = new Map<string, AbsentPerson>();
    const offLater = new Set<string>();
    for (const absence of absences) {
      if (absence.startDate <= today && absence.endDate >= today) {
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
    userId: string,
    changedSince: Date | undefined,
    pageable: Pageable<TimeOffRequestSortField>,
  ): Promise<TimeOffRequestPage> {
    const employee = await this.requireSelf(userId);
    const page = await this.requestRepository.findPageByEmployee(
      employee.id,
      changedSince,
      pageable,
    );
    return { content: await this.withHistory(page.content), totalElements: page.totalElements };
  }

  /**
   * Request time off: working days > 0, within employment, no overlap with a pending or approved
   * request, within the balance of the cycle of its first day (vacation, sick days). Decided by
   * the employee's responsible people, so the employee needs at least one.
   */
  @Transactional()
  async create(userId: string, command: CreateTimeOffCommand): Promise<TimeOffRequestView> {
    const employee = await this.requireSelf(userId);
    const startDate = asDate(command.startDate);
    const endDate = asDate(command.endDate);
    if (startDate < employee.startDate) {
      throw new BusinessRuleException('errors.timeOff.beforeStart', {}, 'startDate');
    }
    if (employee.terminatedOn && endDate >= employee.terminatedOn) {
      throw new BusinessRuleException('errors.timeOff.afterTermination', {}, 'endDate');
    }
    const days = workingDaysBetween(startDate, endDate);
    if (days === 0) {
      throw new BusinessRuleException('errors.timeOff.noWorkingDays', {}, 'endDate');
    }
    if (await this.requestRepository.existsHeldOverlapping(employee.id, startDate, endDate)) {
      throw new BusinessRuleException('errors.timeOff.overlaps', {}, 'startDate');
    }
    const balance = (await this.balancesOf(employee, startDate)).find(
      (item) => item.type === command.type,
    );
    if (balance?.available !== null && balance !== undefined && days > balance.available) {
      throw new BusinessRuleException(
        'errors.timeOff.notEnoughDays',
        { available: balance.available, requested: days },
        'endDate',
      );
    }
    if (employee.responsibleUserIds.length === 0) {
      throw new BusinessRuleException('errors.timeOff.noResponsible');
    }
    const request = await this.requestRepository.create({
      employeeId: employee.id,
      type: command.type,
      startDate,
      endDate,
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
        ...changeOf(AuditField.PERIOD_START, null, auditValue.date(request.startDate)),
        ...changeOf(AuditField.PERIOD_END, null, auditValue.date(request.endDate)),
        ...changeOf(AuditField.DAYS, null, auditValue.number(request.days)),
        ...(request.note ? changeOf(AuditField.NOTE, null, auditValue.text(request.note)) : []),
      ],
    });
    const [view] = await this.withHistory([request]);
    if (!view) {
      throw new Error('Created request lost its view');
    }
    return view;
  }

  /** The policy has checked the request is the caller's. Pending, or approved and not started. */
  @Transactional()
  async cancel(userId: string, requestId: string): Promise<TimeOffRequestView> {
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new ResourceNotFoundException();
    }
    if (request.status === TimeOffStatus.CANCELED) {
      // Canceling again changes nothing.
      return this.viewOf(request);
    }
    if (!isCancelable(request, todayUtc())) {
      throw new BusinessRuleException('errors.timeOff.notCancelable');
    }
    if (
      !(await this.requestRepository.changeStatus(
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
    const after = await this.requestRepository.findById(requestId);
    if (!after) {
      throw new Error('Canceled request not found in the same transaction');
    }
    return this.viewOf(after);
  }

  private async viewOf(request: TimeOffRequestRecord): Promise<TimeOffRequestView> {
    const [view] = await this.withHistory([request]);
    if (!view) {
      throw new Error('Request lost its view');
    }
    return view;
  }

  /** One history query for the whole page. */
  private async withHistory(requests: TimeOffRequestRecord[]): Promise<TimeOffRequestView[]> {
    const events = await this.auditService.findByTargets(requests.map((request) => request.id));
    const today = todayUtc();
    return requests.map((request) => ({
      request,
      history: events.filter((event) => event.target.id === request.id),
      canCancel: isCancelable(request, today),
    }));
  }

  /** Balances for the cycles that hold `date`; one query for every type. */
  private async balancesOf(employee: EmployeeForTimeOff, date: Date): Promise<LeaveBalance[]> {
    const cycles = TIME_OFF_TYPES.map((type) => ({
      type,
      ...cycleOf(employee.startDate, LEAVE_POLICY[type].cycleMonths, date),
    }));
    const from = new Date(Math.min(...cycles.map((cycle) => cycle.start.getTime())));
    const to = new Date(Math.max(...cycles.map((cycle) => cycle.end.getTime())));
    const held = await this.requestRepository.findHeldStartingBetween(employee.id, from, to);
    return cycles.map(({ type, start, end }) => {
      const inCycle = held.filter(
        (request) =>
          request.type === type && request.startDate >= start && request.startDate <= end,
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
        cycleStart: start,
        cycleEnd: end,
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
