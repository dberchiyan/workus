-- Multi-tenancy: the organisation is the tenant. Every user belongs to one organisation and
-- every tenant-owned row carries organisation_id; child rows reference their parents by
-- (organisation_id, id), so rows of two organisations can never be linked.
-- Existing rows all belong to the first organisation, "OSDB" (fixed id, also used by the seed).

-- CreateTable
CREATE TABLE "organisations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_organisations" PRIMARY KEY ("id")
);

-- A name is not blank.
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_name_not_blank" CHECK (btrim("name") <> '');

INSERT INTO "organisations" ("id", "name", "updated_at") VALUES ('01960000-0000-7000-8000-000000000001', 'OSDB', CURRENT_TIMESTAMP);

-- The new role: an owner can do everything an admin can, and manages the organisation and roles.
ALTER TABLE "users" DROP CONSTRAINT "ck_users_role";
ALTER TABLE "users"
    ADD CONSTRAINT "ck_users_role" CHECK ("role" IN ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'));

-- DropForeignKey
ALTER TABLE "audit_events" DROP CONSTRAINT "fk_audit_events_employee_id";

-- DropForeignKey
ALTER TABLE "employee_responsibles" DROP CONSTRAINT "fk_employee_responsibles_employee_id";

-- DropForeignKey
ALTER TABLE "employee_responsibles" DROP CONSTRAINT "fk_employee_responsibles_responsible_user_id";

-- DropForeignKey
ALTER TABLE "employee_review_responsibles" DROP CONSTRAINT "fk_employee_review_responsibles_responsible_user_id";

-- DropForeignKey
ALTER TABLE "employee_review_responsibles" DROP CONSTRAINT "fk_employee_review_responsibles_review_id";

-- DropForeignKey
ALTER TABLE "employee_reviews" DROP CONSTRAINT "fk_employee_reviews_employee_id";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "fk_employees_user_id";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "fk_notifications_recipient_user_id";

-- DropForeignKey
ALTER TABLE "time_off_request_comments" DROP CONSTRAINT "fk_time_off_request_comments_author_id";

-- DropForeignKey
ALTER TABLE "time_off_request_comments" DROP CONSTRAINT "fk_time_off_request_comments_request_id";

-- DropForeignKey
ALTER TABLE "time_off_request_responsibles" DROP CONSTRAINT "fk_time_off_request_responsibles_request_id";

-- DropForeignKey
ALTER TABLE "time_off_request_responsibles" DROP CONSTRAINT "fk_time_off_request_responsibles_responsible_user_id";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "fk_time_off_requests_decided_by";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "fk_time_off_requests_employee_id";

-- DropIndex
DROP INDEX "uq_company_holidays_date";

-- DropIndex
DROP INDEX "uq_employees_user_id";

-- DropIndex
DROP INDEX "idx_time_off_requests_status_created_at";

-- Existing rows go to OSDB: added with that default (no UPDATE — audit_events rejects it), then
-- the default is dropped so every new row must name its organisation.

ALTER TABLE "audit_events" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "audit_events" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "company_holidays" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "company_holidays" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "employee_responsibles" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "employee_responsibles" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "employee_review_responsibles" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "employee_review_responsibles" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "employee_reviews" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "employee_reviews" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "employees" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "employees" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "notifications" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "notifications" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "time_off_request_comments" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "time_off_request_comments" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "time_off_request_responsibles" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "time_off_request_responsibles" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "time_off_requests" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "time_off_requests" ALTER COLUMN "organisation_id" DROP DEFAULT;

ALTER TABLE "users" ADD COLUMN "organisation_id" UUID NOT NULL DEFAULT '01960000-0000-7000-8000-000000000001';
ALTER TABLE "users" ALTER COLUMN "organisation_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "idx_audit_events_organisation_id_occurred_at" ON "audit_events"("organisation_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_company_holidays_organisation_id_date" ON "company_holidays"("organisation_id", "date");

-- CreateIndex
CREATE INDEX "idx_employee_responsibles_organisation_id" ON "employee_responsibles"("organisation_id");

-- CreateIndex
CREATE INDEX "idx_employee_review_responsibles_organisation_id" ON "employee_review_responsibles"("organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employee_reviews_organisation_id_id" ON "employee_reviews"("organisation_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employees_organisation_id_user_id" ON "employees"("organisation_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employees_organisation_id_id" ON "employees"("organisation_id", "id");

-- CreateIndex
CREATE INDEX "idx_notifications_organisation_id" ON "notifications"("organisation_id");

-- CreateIndex
CREATE INDEX "idx_time_off_request_comments_organisation_id" ON "time_off_request_comments"("organisation_id");

-- CreateIndex
CREATE INDEX "idx_time_off_request_responsibles_organisation_id" ON "time_off_request_responsibles"("organisation_id");

-- CreateIndex
CREATE INDEX "idx_time_off_requests_organisation_id_status_created_at" ON "time_off_requests"("organisation_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_time_off_requests_organisation_id_id" ON "time_off_requests"("organisation_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_organisation_id_id" ON "users"("organisation_id", "id");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "fk_audit_events_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "fk_audit_events_employee_id" FOREIGN KEY ("organisation_id", "employee_id") REFERENCES "employees"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_user_id" FOREIGN KEY ("organisation_id", "user_id") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_employee_id" FOREIGN KEY ("organisation_id", "employee_id") REFERENCES "employees"("organisation_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_responsible_user_id" FOREIGN KEY ("organisation_id", "responsible_user_id") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_recipient_user_id" FOREIGN KEY ("organisation_id", "recipient_user_id") REFERENCES "users"("organisation_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_reviews" ADD CONSTRAINT "fk_employee_reviews_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_reviews" ADD CONSTRAINT "fk_employee_reviews_employee_id" FOREIGN KEY ("organisation_id", "employee_id") REFERENCES "employees"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_review_id" FOREIGN KEY ("organisation_id", "review_id") REFERENCES "employee_reviews"("organisation_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_responsible_user_id" FOREIGN KEY ("organisation_id", "responsible_user_id") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_employee_id" FOREIGN KEY ("organisation_id", "employee_id") REFERENCES "employees"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_decided_by" FOREIGN KEY ("organisation_id", "decided_by") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_request_id" FOREIGN KEY ("organisation_id", "request_id") REFERENCES "time_off_requests"("organisation_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_responsible_user_id" FOREIGN KEY ("organisation_id", "responsible_user_id") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_request_id" FOREIGN KEY ("organisation_id", "request_id") REFERENCES "time_off_requests"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_author_id" FOREIGN KEY ("organisation_id", "author_id") REFERENCES "users"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_holidays" ADD CONSTRAINT "fk_company_holidays_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Organisation changes and role changes go to the audit log.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'organisation.created', 'organisation.updated',
                        'user.role_changed', 'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review', 'time_off_request', 'holiday', 'user',
                             'organisation'));
