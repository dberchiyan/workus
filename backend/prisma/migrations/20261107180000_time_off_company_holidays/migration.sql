-- CreateTable
CREATE TABLE "company_holidays" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "date" DATE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "carried_over" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_company_holidays" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_company_holidays_recurring_carried_over" ON "company_holidays"("recurring", "carried_over");

-- CreateIndex
CREATE UNIQUE INDEX "uq_company_holidays_date" ON "company_holidays"("date");

-- A name is not blank.
ALTER TABLE "company_holidays"
    ADD CONSTRAINT "ck_company_holidays_name_not_blank" CHECK (btrim("name") <> '');

-- A holiday added after a request was made may take its last working day: days >= 0 (a new
-- request still needs at least one — checked by the service).
ALTER TABLE "time_off_requests" DROP CONSTRAINT "ck_time_off_requests_days_positive";
ALTER TABLE "time_off_requests"
    ADD CONSTRAINT "ck_time_off_requests_days_non_negative" CHECK ("days" >= 0);

-- Holiday changes go to the audit log (target type holiday, no employee).
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review', 'time_off_request', 'holiday', 'user'));
