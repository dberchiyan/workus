-- Fails while termination events exist: the history is append-only and is never rewritten.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'review.created', 'review.updated', 'review.deleted'));

ALTER TABLE "employees"
    DROP CONSTRAINT IF EXISTS "ck_employees_termination_other_comment",
    DROP CONSTRAINT IF EXISTS "ck_employees_termination_comment_with_date",
    DROP CONSTRAINT IF EXISTS "ck_employees_termination_reason_with_date",
    DROP CONSTRAINT IF EXISTS "ck_employees_termination_reason",
    DROP COLUMN IF EXISTS "termination_comment",
    DROP COLUMN IF EXISTS "termination_reason";
