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
import { NotificationType } from '../../notification/service/notification-type';
import type { ManagedTimeOffRequestRecord } from '../repository/record/time-off-request.record';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { timeOffLabel } from './time-off-label';
import { TimeOffNotifier } from './time-off-notifier';
import { EmployeeService } from '../../employee/core/service/employee.service';
import type { TimeOffRequestCriteria } from './time-off-request.criteria';
import type { ManagedRequestSortField } from './time-off-sort';
import { TimeOffStatus } from './time-off-type';
import type { ManagedTimeOffRequestPage, ManagedTimeOffRequestView } from './time-off.types';

/** Status changes a responsible person can make, with what they lead to. */
const DECISIONS = {
  approve: {
    from: [TimeOffStatus.PENDING],
    to: TimeOffStatus.APPROVED,
    action: AuditAction.TIME_OFF_REQUEST_APPROVED,
    notice: NotificationType.TIME_OFF_APPROVED,
    decided: true,
    refusal: 'errors.timeOff.notPending',
  },
  reject: {
    from: [TimeOffStatus.PENDING],
    to: TimeOffStatus.REJECTED,
    action: AuditAction.TIME_OFF_REQUEST_REJECTED,
    notice: NotificationType.TIME_OFF_REJECTED,
    decided: true,
    refusal: 'errors.timeOff.notPending',
  },
  // A responsible person may cancel an approved request at any time, even once it has started.
  cancel: {
    from: [TimeOffStatus.PENDING, TimeOffStatus.APPROVED],
    to: TimeOffStatus.CANCELED,
    action: AuditAction.TIME_OFF_REQUEST_CANCELED,
    notice: NotificationType.TIME_OFF_CANCELED,
    decided: false,
    refusal: 'errors.timeOff.notCancelable',
  },
} as const;
export type TimeOffDecision = keyof typeof DECISIONS;

/** Responsible people as an audit value, sorted by id so order never reads as a change. */
const peopleOf = (request: ManagedTimeOffRequestRecord) => {
  const people = request.responsibles
    .map(({ responsible }) => ({
      id: responsible.id,
      firstName: responsible.firstName,
      lastName: responsible.lastName,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return people.length > 0 ? auditValue.people(people) : null;
};

const isResponsible = (request: ManagedTimeOffRequestRecord, userId: string): boolean =>
  request.responsibles.some(({ responsible }) => responsible.id === userId);

/** Every employee's requests for admins: lists, decisions by responsible people, comments. */
@Injectable()
export class TimeOffDecisionService {
  constructor(
    private readonly requestRepository: TimeOffRequestRepository,
    private readonly auditService: AuditService,
    private readonly employeeService: EmployeeService,
    private readonly notifier: TimeOffNotifier,
  ) {}

  async findPage(
    organisationId: string,
    criteria: TimeOffRequestCriteria,
    pageable: Pageable<ManagedRequestSortField>,
    viewerId: string,
  ): Promise<ManagedTimeOffRequestPage> {
    const page = await this.requestRepository.findManagedPage(organisationId, criteria, pageable);
    return {
      content: await this.withHistory(organisationId, page.content, viewerId),
      totalElements: page.totalElements,
    };
  }

  async findOne(
    organisationId: string,
    requestId: string,
    viewerId: string,
  ): Promise<ManagedTimeOffRequestView> {
    return this.viewOf(organisationId, await this.require(organisationId, requestId), viewerId);
  }

  /**
   * The policy has checked the caller is one of the request's responsible people. Repeating a
   * decision that already holds changes nothing.
   */
  @Transactional()
  async decide(
    organisationId: string,
    requestId: string,
    decision: TimeOffDecision,
    actorId: string,
    /** Why — rejections only; shown to the employee. */
    comment?: string,
  ): Promise<ManagedTimeOffRequestView> {
    const rule = DECISIONS[decision];
    const request = await this.requestRepository.findStateById(organisationId, requestId);
    if (!request) {
      throw new ResourceNotFoundException();
    }
    if (request.status === rule.to) {
      return this.viewOf(organisationId, await this.require(organisationId, requestId), actorId);
    }
    if (!(rule.from as readonly string[]).includes(request.status)) {
      throw new BusinessRuleException(rule.refusal);
    }
    if (
      !(await this.requestRepository.changeStatus(
        organisationId,
        requestId,
        request.status,
        rule.to,
        actorId,
        rule.decided,
        rule.decided ? (comment ?? null) : null,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.auditService.record({
      action: rule.action,
      employeeId: request.employeeId,
      target: {
        type: AuditTargetType.TIME_OFF_REQUEST,
        id: requestId,
        label: timeOffLabel(request),
      },
      changes: [
        ...changeOf(
          AuditField.STATUS,
          auditValue.timeOffStatus(request.status),
          auditValue.timeOffStatus(rule.to),
        ),
        ...(rule.decided && comment
          ? changeOf(AuditField.DECISION_COMMENT, null, auditValue.text(comment))
          : []),
      ],
    });
    await this.notifier.notify(organisationId, requestId, rule.notice, actorId, 'employee');
    return this.viewOf(organisationId, await this.require(organisationId, requestId), actorId);
  }

  /**
   * Any admin changes who decides a pending request (admins only, 1–10). The same set changes
   * nothing; otherwise the history records the people before and after.
   */
  @Transactional()
  async updateResponsibles(
    organisationId: string,
    requestId: string,
    responsibleUserIds: string[],
    actorId: string,
  ): Promise<ManagedTimeOffRequestView> {
    const before = await this.require(organisationId, requestId);
    if (before.status !== TimeOffStatus.PENDING) {
      throw new BusinessRuleException('errors.timeOff.notPending');
    }
    const next = [...new Set(responsibleUserIds)];
    if (!(await this.employeeService.areResponsibleCandidates(organisationId, next))) {
      throw new BusinessRuleException(
        'errors.employee.responsibleNotFound',
        {},
        'responsibleUserIds',
      );
    }
    const current = before.responsibles.map(({ responsible }) => responsible.id);
    if (current.length === next.length && next.every((id) => current.includes(id))) {
      return this.viewOf(organisationId, before, actorId);
    }
    if (
      !(await this.requestRepository.replaceResponsibles(organisationId, requestId, next, actorId))
    ) {
      throw new ConcurrentModificationException();
    }
    const after = await this.require(organisationId, requestId);
    await this.auditService.record({
      action: AuditAction.TIME_OFF_REQUEST_UPDATED,
      employeeId: after.employeeId,
      target: { type: AuditTargetType.TIME_OFF_REQUEST, id: requestId, label: timeOffLabel(after) },
      changes: changeOf(AuditField.RESPONSIBLES, peopleOf(before), peopleOf(after)),
    });
    // Only the people newly made responsible hear of it.
    await this.notifier.notify(
      organisationId,
      requestId,
      NotificationType.TIME_OFF_ASSIGNED,
      actorId,
      next.filter((id) => !current.includes(id)),
    );
    return this.viewOf(organisationId, after, actorId);
  }

  private async require(
    organisationId: string,
    requestId: string,
  ): Promise<ManagedTimeOffRequestRecord> {
    const request = await this.requestRepository.findManagedById(organisationId, requestId);
    if (!request) {
      throw new ResourceNotFoundException();
    }
    return request;
  }

  private async viewOf(
    organisationId: string,
    request: ManagedTimeOffRequestRecord,
    viewerId: string,
  ): Promise<ManagedTimeOffRequestView> {
    const [view] = await this.withHistory(organisationId, [request], viewerId);
    if (!view) {
      throw new Error('Request lost its view');
    }
    return view;
  }

  /** One history query for the whole page; what the viewer may do with each request. */
  private async withHistory(
    organisationId: string,
    requests: ManagedTimeOffRequestRecord[],
    viewerId: string,
  ): Promise<ManagedTimeOffRequestView[]> {
    const events = await this.auditService.findByTargets(
      organisationId,
      requests.map((request) => request.id),
    );
    return requests.map((request) => {
      const responsible = isResponsible(request, viewerId);
      const allows = (decision: TimeOffDecision) =>
        responsible && (DECISIONS[decision].from as readonly string[]).includes(request.status);
      return {
        request,
        history: events.filter((event) => event.target.id === request.id),
        can: { approve: allows('approve'), reject: allows('reject'), cancel: allows('cancel') },
      };
    });
  }
}
