-- Editing an employee (first: their responsible people) is recorded as employee.updated.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'review.created', 'review.updated', 'review.deleted'));
