-- Fails while time-off events exist: the history is append-only and is never rewritten.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review'));
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted'));
DROP INDEX IF EXISTS "idx_audit_events_target_id_occurred_at";
DROP TABLE IF EXISTS "time_off_request_responsibles";
DROP TABLE IF EXISTS "time_off_requests";
