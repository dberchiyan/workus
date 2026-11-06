-- Time-off requests and who may decide them (time-off module).
CREATE TABLE "time_off_requests" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "employee_id" UUID NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "note" VARCHAR(500),
    "decision_comment" VARCHAR(500),
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_time_off_requests" PRIMARY KEY ("id")
);

CREATE TABLE "time_off_request_responsibles" (
    "request_id" UUID NOT NULL,
    "responsible_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "pk_time_off_request_responsibles" PRIMARY KEY ("request_id","responsible_user_id")
);

CREATE INDEX "idx_time_off_requests_employee_id_start_date" ON "time_off_requests"("employee_id", "start_date");

CREATE INDEX "idx_time_off_requests_decided_by" ON "time_off_requests"("decided_by");

CREATE INDEX "idx_time_off_request_responsibles_responsible_user_id" ON "time_off_request_responsibles"("responsible_user_id");

CREATE INDEX "idx_audit_events_target_id_occurred_at" ON "audit_events"("target_id", "occurred_at");

ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_request_id" FOREIGN KEY ("request_id") REFERENCES "time_off_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_off_requests"
    ADD CONSTRAINT "ck_time_off_requests_type" CHECK ("type" IN ('VACATION', 'SICK_DAY', 'DAY_OFF')),
    ADD CONSTRAINT "ck_time_off_requests_status" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED')),
    ADD CONSTRAINT "ck_time_off_requests_period" CHECK ("end_date" >= "start_date"),
    ADD CONSTRAINT "ck_time_off_requests_days_positive" CHECK ("days" > 0),
    ADD CONSTRAINT "ck_time_off_requests_decision" CHECK (("decided_by" IS NULL) = ("decided_at" IS NULL));

-- Request events in the history.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled'));
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review', 'time_off_request'));
