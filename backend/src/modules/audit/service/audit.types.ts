import type { AuditAction, AuditTargetType } from './audit-action';
import type { AuditChange } from './audit-change';

export interface NewAuditEvent {
  action: AuditAction;
  /** Who acted when there is no signed-in principal yet (sign-in); default: the principal. */
  actorUserId?: string | null;
  /** The tenant; default: the principal's. Required when there is none (sign-in, jobs). */
  organisationId?: string;
  employeeId: string | null;
  target: { type: AuditTargetType; id: string; label: string };
  changes: AuditChange[];
}

export interface AuditActor {
  id: string;
  firstName: string;
  lastName: string;
  /** Null for admins (no employee record). */
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

/** One entry of a user's security log. */
export interface SecurityEvent {
  id: string;
  occurredAt: Date;
  action: AuditAction;
  ipAddress: string | null;
  userAgent: string | null;
  /** A sign-in from a device the user had not signed in from before. */
  newDevice: boolean;
}

export interface SecurityEventPage {
  content: SecurityEvent[];
  totalElements: number;
}
