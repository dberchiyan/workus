-- Reverts 20261107180000_time_off_company_holidays. Fails if audit events of holidays or
-- requests with 0 days exist — delete / fix them first (incidents only).
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_target_type";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_target_type"
    CHECK ("target_type" IN ('employee', 'review', 'time_off_request', 'user'));
ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
ALTER TABLE "time_off_requests" DROP CONSTRAINT "ck_time_off_requests_days_non_negative";
ALTER TABLE "time_off_requests"
    ADD CONSTRAINT "ck_time_off_requests_days_positive" CHECK ("days" > 0);
DROP TABLE "company_holidays";
