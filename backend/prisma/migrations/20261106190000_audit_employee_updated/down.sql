-- Fails while employee.updated rows exist: the history is append-only and is never rewritten.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'review.created', 'review.updated', 'review.deleted'));
