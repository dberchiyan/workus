import type { AuditAction, AuditTargetType } from './audit-action';
import type { AuditChange } from './audit-change';

export interface NewAuditEvent {
  action: AuditAction;
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
