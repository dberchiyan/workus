-- Monthly subscriptions (Stripe): the plan in effect, the subscription's state and the provider's
-- ids live on the company (existing companies start on Starter); webhook deliveries are stored
-- before they are processed; plan changes go to the company's history.
ALTER TABLE "organisations"
    ADD COLUMN "plan" VARCHAR(16) NOT NULL DEFAULT 'STARTER',
    ADD COLUMN "subscription_status" VARCHAR(16) NOT NULL DEFAULT 'NONE',
    ADD COLUMN "scheduled_plan" VARCHAR(16),
    ADD COLUMN "current_period_end" TIMESTAMPTZ(3),
    ADD COLUMN "past_due_since" TIMESTAMPTZ(3),
    ADD COLUMN "billing_customer_id" VARCHAR(64),
    ADD COLUMN "billing_subscription_id" VARCHAR(64);

ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_plan" CHECK ("plan" IN ('STARTER', 'TEAM', 'BUSINESS'));
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_scheduled_plan"
    CHECK ("scheduled_plan" IS NULL OR "scheduled_plan" IN ('STARTER', 'TEAM', 'BUSINESS'));
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_subscription_status"
    CHECK ("subscription_status" IN ('NONE', 'ACTIVE', 'PAST_DUE'));
-- A failed payment is dated (the grace period counts from it); nothing else is.
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_past_due_since"
    CHECK (("subscription_status" = 'PAST_DUE') = ("past_due_since" IS NOT NULL));
-- A subscription id exists exactly while there is a subscription.
ALTER TABLE "organisations"
    ADD CONSTRAINT "ck_organisations_billing_subscription_id"
    CHECK (("subscription_status" = 'NONE') = ("billing_subscription_id" IS NULL));

CREATE UNIQUE INDEX "uq_organisations_billing_customer_id" ON "organisations"("billing_customer_id");
CREATE UNIQUE INDEX "uq_organisations_billing_subscription_id" ON "organisations"("billing_subscription_id");
CREATE INDEX "idx_organisations_subscription_status_past_due_since"
    ON "organisations"("subscription_status", "past_due_since");

CREATE TABLE "billing_events" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "provider_event_id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "organisation_id" UUID,
    "subscription_id" VARCHAR(64),
    "customer_id" VARCHAR(64),
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),
    "error" VARCHAR(255),

    CONSTRAINT "pk_billing_events" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_billing_events_provider_event_id" ON "billing_events"("provider_event_id");
CREATE INDEX "idx_billing_events_organisation_id_received_at" ON "billing_events"("organisation_id", "received_at");
CREATE INDEX "idx_billing_events_processed_at_received_at" ON "billing_events"("processed_at", "received_at");
ALTER TABLE "billing_events" ADD CONSTRAINT "fk_billing_events_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_events" DROP CONSTRAINT "ck_audit_events_action";
ALTER TABLE "audit_events" ADD CONSTRAINT "ck_audit_events_action"
    CHECK ("action" IN ('employee.created', 'employee.updated', 'employee.terminated',
                        'employee.termination_canceled', 'review.created', 'review.updated',
                        'review.deleted', 'time_off_request.created', 'time_off_request.approved',
                        'time_off_request.rejected', 'time_off_request.canceled',
                        'time_off_request.updated', 'holiday.created', 'holiday.updated',
                        'holiday.deleted', 'organisation.created', 'organisation.updated',
                        'organisation.approved', 'organisation.rejected',
                        'organisation.plan_changed',
                        'user.role_changed', 'user.created', 'user.updated',
                        'department.created', 'department.updated', 'department.deleted',
                        'position.created', 'position.updated', 'position.deleted',
                        'auth.signed_in', 'auth.sign_in_failed',
                        'auth.sign_in_refused', 'auth.signed_out', 'auth.password_changed',
                        'auth.password_reset', 'auth.session_ended', 'auth.other_sessions_ended',
                        'auth.session_evicted', 'auth.sessions_ended_on_termination',
                        'auth.sign_in_locked'));
