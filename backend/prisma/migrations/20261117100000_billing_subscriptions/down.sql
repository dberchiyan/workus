-- Refuses while organisation.plan_changed events exist (audit rows are append-only).
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'organisation.created', 'organisation.updated',
                        'organisation.approved', 'organisation.rejected',
                        'user.role_changed', 'user.created', 'user.updated',
                        'department.created', 'department.updated', 'department.deleted',
                        'position.created', 'position.updated', 'position.deleted',
                        'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.password_reset', 'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));

DROP TABLE "billing_events";

DROP INDEX "idx_organisations_subscription_status_past_due_since";
DROP INDEX "uq_organisations_billing_subscription_id";
DROP INDEX "uq_organisations_billing_customer_id";
ALTER TABLE "organisations"
    DROP CONSTRAINT "ck_organisations_billing_subscription_id",
    DROP CONSTRAINT "ck_organisations_past_due_since",
    DROP CONSTRAINT "ck_organisations_subscription_status",
    DROP CONSTRAINT "ck_organisations_scheduled_plan",
    DROP CONSTRAINT "ck_organisations_plan";
ALTER TABLE "organisations"
    DROP COLUMN "billing_subscription_id",
    DROP COLUMN "billing_customer_id",
    DROP COLUMN "past_due_since",
    DROP COLUMN "current_period_end",
    DROP COLUMN "scheduled_plan",
    DROP COLUMN "subscription_status",
    DROP COLUMN "plan";
