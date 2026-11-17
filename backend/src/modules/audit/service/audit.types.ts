import type { AuditAction, AuditTargetType } from './audit-action';
import type { AuditChange } from './audit-change';

export interface NewAuditEvent {
    action: AuditAction;
    actorUserId?: string | null;
    organisationId?: string;
    employeeId: string | null;
    target: { type: AuditTargetType; id: string; label: string };
    changes: AuditChange[];
}

export interface AuditActor {
    id: string;
    firstName: string;
    lastName: string;
    positionTitle: string | null;
}

export interface AuditEvent {
    id: string;
    occurredAt: Date;
    action: AuditAction;
    actor: AuditActor | null;
    target: { type: AuditTargetType; id: string; label: string };
    changes: AuditChange[];
}

export interface AuditEventPage {
    content: AuditEvent[];
    totalElements: number;
}

export interface SecurityEvent {
    id: string;
    occurredAt: Date;
    action: AuditAction;
    ipAddress: string | null;
    userAgent: string | null;
    isNewDevice: boolean;
}

export interface SecurityEventPage {
    content: SecurityEvent[];
    totalElements: number;
}
