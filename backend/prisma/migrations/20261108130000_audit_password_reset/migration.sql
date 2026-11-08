-- An admin can reset an employee's password (a new generated one): logged in the person's
-- security log as auth.password_reset.
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
                        'auth.password_reset', 'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
