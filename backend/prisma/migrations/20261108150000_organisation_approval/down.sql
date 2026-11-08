-- Reverts 20261108150000_organisation_approval. Fails while platform admins or approval events
-- exist — remove them first (incidents only).
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'organisation.created', 'organisation.updated',
                        'user.role_changed', 'user.created', 'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.password_reset', 'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
ALTER TABLE "users" DROP CONSTRAINT "ck_users_role";
ALTER TABLE "users" ADD CONSTRAINT "ck_users_role"
    CHECK ("role" IN ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'));
DELETE FROM "organisations" WHERE "id" = '01960000-0000-7000-8000-000000000000';
ALTER TABLE "organisations" DROP CONSTRAINT "fk_organisations_decided_by";
DROP INDEX "idx_organisations_decided_by";
DROP INDEX "idx_organisations_status_created_at";
ALTER TABLE "organisations"
    DROP COLUMN "rejection_reason",
    DROP COLUMN "decided_by",
    DROP COLUMN "decided_at",
    DROP COLUMN "is_platform",
    DROP COLUMN "status";
