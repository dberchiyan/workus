-- New companies wait for a Workus platform admin's approval: organisations get a status (existing
-- ones are ACTIVE), the decision (who, when, why rejected), and the internal "Workus Platform"
-- organisation that holds platform admins (role PLATFORM_ADMIN) — never listed as a company.

-- Existing rows are ACTIVE (added with that default), then the default is dropped so every new
-- organisation names its status (registration: PENDING).
ALTER TABLE "organisations"
    ADD COLUMN "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "is_platform" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "decided_at" TIMESTAMPTZ(3),
    ADD COLUMN "decided_by" UUID,
    ADD COLUMN "rejection_reason" VARCHAR(500);
ALTER TABLE "organisations" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_status" CHECK ("status" IN ('PENDING', 'ACTIVE', 'REJECTED'));
-- A rejection always says why; only a rejected organisation has a reason.
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_rejection_reason"
    CHECK (("status" = 'REJECTED') = ("rejection_reason" IS NOT NULL));

CREATE INDEX "idx_organisations_status_created_at" ON "organisations"("status", "created_at");
CREATE INDEX "idx_organisations_decided_by" ON "organisations"("decided_by");
ALTER TABLE "organisations" ADD CONSTRAINT "fk_organisations_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The platform organisation (fixed id, also used by the seed).
INSERT INTO "organisations" ("id", "name", "status", "is_platform", "updated_at")
VALUES ('01960000-0000-7000-8000-000000000000', 'Workus Platform', 'ACTIVE', true, CURRENT_TIMESTAMP);

ALTER TABLE "users" DROP CONSTRAINT "ck_users_role";
ALTER TABLE "users" ADD CONSTRAINT "ck_users_role"
    CHECK ("role" IN ('PLATFORM_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'));

ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'organisation.created', 'organisation.updated',
                        'organisation.approved', 'organisation.rejected',
                        'user.role_changed', 'user.created', 'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.password_reset', 'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
