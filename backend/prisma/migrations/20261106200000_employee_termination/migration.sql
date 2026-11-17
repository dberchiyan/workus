ALTER TABLE "employees"
    ADD COLUMN "termination_reason" VARCHAR(32),
    ADD COLUMN "termination_comment" VARCHAR(500);

UPDATE "employees"
SET "termination_reason" = 'OTHER', "termination_comment" = 'Recorded before termination reasons existed'
WHERE "terminated_at" IS NOT NULL;

ALTER TABLE "employees"
    ADD CONSTRAINT "ck_employees_termination_reason"
        CHECK ("termination_reason" IN ('RESIGNATION', 'DISMISSAL', 'END_OF_CONTRACT', 'LAYOFF', 'OTHER')),
    ADD CONSTRAINT "ck_employees_termination_reason_with_date"
        CHECK (("terminated_at" IS NULL) = ("termination_reason" IS NULL)),
    ADD CONSTRAINT "ck_employees_termination_comment_with_date"
        CHECK ("termination_comment" IS NULL OR "terminated_at" IS NOT NULL),
    ADD CONSTRAINT "ck_employees_termination_other_comment"
        CHECK ("termination_reason" IS DISTINCT FROM 'OTHER' OR "termination_comment" IS NOT NULL);

ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted'));
