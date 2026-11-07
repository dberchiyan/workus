-- Reverts 20261108100000_organisation_tenancy. Only possible while a single organisation exists
-- (rows of others would collide on the restored global uniques), no user is an OWNER and no
-- organisation / role events were logged — incidents only.
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review', 'time_off_request', 'holiday', 'user'));
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

-- Composite foreign keys go; the single-column ones come back.
ALTER TABLE "audit_events" DROP CONSTRAINT "fk_audit_events_employee_id";
ALTER TABLE "employees" DROP CONSTRAINT "fk_employees_user_id";
ALTER TABLE "employee_responsibles" DROP CONSTRAINT "fk_employee_responsibles_employee_id";
ALTER TABLE "employee_responsibles" DROP CONSTRAINT "fk_employee_responsibles_responsible_user_id";
ALTER TABLE "notifications" DROP CONSTRAINT "fk_notifications_recipient_user_id";
ALTER TABLE "employee_reviews" DROP CONSTRAINT "fk_employee_reviews_employee_id";
ALTER TABLE "employee_review_responsibles" DROP CONSTRAINT "fk_employee_review_responsibles_review_id";
ALTER TABLE "employee_review_responsibles" DROP CONSTRAINT "fk_employee_review_responsibles_responsible_user_id";
ALTER TABLE "time_off_requests" DROP CONSTRAINT "fk_time_off_requests_employee_id";
ALTER TABLE "time_off_requests" DROP CONSTRAINT "fk_time_off_requests_decided_by";
ALTER TABLE "time_off_request_responsibles" DROP CONSTRAINT "fk_time_off_request_responsibles_request_id";
ALTER TABLE "time_off_request_responsibles" DROP CONSTRAINT "fk_time_off_request_responsibles_responsible_user_id";
ALTER TABLE "time_off_request_comments" DROP CONSTRAINT "fk_time_off_request_comments_request_id";
ALTER TABLE "time_off_request_comments" DROP CONSTRAINT "fk_time_off_request_comments_author_id";

ALTER TABLE "audit_events" DROP COLUMN "organisation_id";
ALTER TABLE "company_holidays" DROP COLUMN "organisation_id";
ALTER TABLE "employee_responsibles" DROP COLUMN "organisation_id";
ALTER TABLE "employee_review_responsibles" DROP COLUMN "organisation_id";
ALTER TABLE "employee_reviews" DROP COLUMN "organisation_id";
ALTER TABLE "employees" DROP COLUMN "organisation_id";
ALTER TABLE "notifications" DROP COLUMN "organisation_id";
ALTER TABLE "time_off_request_comments" DROP COLUMN "organisation_id";
ALTER TABLE "time_off_request_responsibles" DROP COLUMN "organisation_id";
ALTER TABLE "time_off_requests" DROP COLUMN "organisation_id";
ALTER TABLE "users" DROP COLUMN "organisation_id";
DROP TABLE "organisations";

ALTER TABLE "users" DROP CONSTRAINT "ck_users_role";
ALTER TABLE "users"
    ADD CONSTRAINT "ck_users_role" CHECK ("role" IN ('ADMIN', 'MANAGER', 'EMPLOYEE'));

CREATE UNIQUE INDEX "uq_company_holidays_date" ON "company_holidays"("date");
CREATE UNIQUE INDEX "uq_employees_user_id" ON "employees"("user_id");
CREATE INDEX "idx_time_off_requests_status_created_at" ON "time_off_requests"("status", "created_at");

ALTER TABLE "audit_events" ADD CONSTRAINT "fk_audit_events_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_recipient_user_id" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_reviews" ADD CONSTRAINT "fk_employee_reviews_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_review_id" FOREIGN KEY ("review_id") REFERENCES "employee_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_off_requests" ADD CONSTRAINT "fk_time_off_requests_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_request_id" FOREIGN KEY ("request_id") REFERENCES "time_off_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_off_request_responsibles" ADD CONSTRAINT "fk_time_off_request_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_request_id" FOREIGN KEY ("request_id") REFERENCES "time_off_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
