import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Pageable } from '../../../common/dto/pageable';
import type { RequestContext } from '../../../common/context/request-context';
import type { AuditEventRecord } from '../repository/record/audit-event.record';
import { AuditEventRepository, type NewAuditEventRow } from '../repository/audit-event.repository';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  type AuditAction,
  type AuditTargetType,
} from './audit-action';
import { AuditChangesSchema } from './audit-change';
import type { AuditEvent, AuditEventPage, NewAuditEvent, SecurityEventPage } from './audit.types';
import type { AuditEventSortField } from './audit-sort';
import {
  ALL_SECURITY_ACTIONS,
  SECURITY_CATEGORY_ACTIONS,
  type SecurityCategory,
} from './security-category';

const isAction = (value: string): value is AuditAction =>
  (AUDIT_ACTIONS as readonly string[]).includes(value);
const isTargetType = (value: string): value is AuditTargetType =>
  (AUDIT_TARGET_TYPES as readonly string[]).includes(value);

@Injectable()
export class AuditService {
  constructor(
    private readonly auditEventRepository: AuditEventRepository,
    private readonly cls: ClsService<RequestContext>,
    @InjectPinoLogger(AuditService.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Call inside the transaction that makes the change (data.md → Audit log). Actor, IP, user
   * agent and trace id come from the request context.
   */
  async record(event: NewAuditEvent): Promise<void> {
    await this.auditEventRepository.create(this.toRow(event));
  }

  /** Several events of one change, written in one statement; same rules as `record`. */
  async recordMany(events: NewAuditEvent[]): Promise<void> {
    await this.auditEventRepository.createMany(events.map((event) => this.toRow(event)));
  }

  private toRow(event: NewAuditEvent): NewAuditEventRow {
    const organisationId = event.organisationId ?? this.cls.get('principal')?.organisationId;
    if (!organisationId) {
      // A programming error: an event outside a request must name its organisation.
      throw new Error('Audit event without an organisation');
    }
    return {
      organisationId,
      action: event.action,
      actorUserId:
        event.actorUserId !== undefined
          ? event.actorUserId
          : (this.cls.get('principal')?.userId ?? null),
      employeeId: event.employeeId,
      targetType: event.target.type,
      targetId: event.target.id,
      targetLabel: event.target.label.slice(0, 255),
      changes: AuditChangesSchema.parse(event.changes),
      ipAddress: this.cls.get('clientIp') ?? null,
      userAgent: this.cls.get('userAgent') ?? null,
      traceId: this.cls.isActive() ? this.cls.getId() : null,
    };
  }

  /** Newest first. */
  async findPageByEmployee(
    organisationId: string,
    employeeId: string,
    pageable: Pageable<AuditEventSortField>,
  ): Promise<AuditEventPage> {
    const page = await this.auditEventRepository.findPageByEmployee(
      organisationId,
      employeeId,
      pageable,
    );
    return {
      content: page.content.flatMap((record) => this.toEvent(record)),
      totalElements: page.totalElements,
    };
  }

  /** A user's security log (sign-ins, password changes, ended sessions), newest first. */
  async findSecurityPage(
    organisationId: string,
    userId: string,
    category: SecurityCategory | null,
    pageable: Pageable<AuditEventSortField>,
  ): Promise<SecurityEventPage> {
    const page = await this.auditEventRepository.findSecurityPage(
      organisationId,
      userId,
      category ? SECURITY_CATEGORY_ACTIONS[category] : ALL_SECURITY_ACTIONS,
      pageable,
    );
    const newDevices = await this.auditEventRepository.findNewDeviceSignIns(
      userId,
      page.content.map((record) => record.id),
    );
    return {
      content: page.content.flatMap((record) =>
        isAction(record.action)
          ? [
              {
                id: record.id,
                occurredAt: record.occurredAt,
                action: record.action,
                ipAddress: record.ipAddress,
                userAgent: record.userAgent,
                newDevice: newDevices.has(record.id),
              },
            ]
          : [],
      ),
      totalElements: page.totalElements,
    };
  }

  /** History of several targets (e.g. a page of requests), oldest first. */
  async findByTargets(organisationId: string, targetIds: string[]): Promise<AuditEvent[]> {
    if (targetIds.length === 0) {
      return [];
    }
    const records = await this.auditEventRepository.findByTargets(organisationId, targetIds);
    return records.flatMap((record) => this.toEvent(record));
  }

  /** Rows are guarded by CHECK constraints; a summary that no longer parses shows no details. */
  private toEvent(record: AuditEventRecord): AuditEvent[] {
    if (!isAction(record.action) || !isTargetType(record.targetType)) {
      this.logger.warn({ auditEventId: record.id }, 'Audit event with an unknown action skipped');
      return [];
    }
    const changes = AuditChangesSchema.safeParse(record.changes);
    if (!changes.success) {
      this.logger.warn({ auditEventId: record.id }, 'Audit event changes do not parse');
    }
    return [
      {
        id: record.id,
        occurredAt: record.occurredAt,
        action: record.action,
        actor: record.actor
          ? {
              id: record.actor.id,
              firstName: record.actor.firstName,
              lastName: record.actor.lastName,
              positionTitle: record.actor.employee?.position.title ?? null,
            }
          : null,
        target: { type: record.targetType, id: record.targetId, label: record.targetLabel },
        changes: changes.success ? changes.data : [],
      },
    ];
  }
}
