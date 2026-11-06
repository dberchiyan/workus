-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" VARCHAR(64) NOT NULL,
    "actor_user_id" UUID,
    "employee_id" UUID,
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" UUID NOT NULL,
    "target_label" VARCHAR(255) NOT NULL,
    "changes" JSONB NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "trace_id" VARCHAR(64),

    CONSTRAINT "pk_audit_events" PRIMARY KEY ("id"),
    CONSTRAINT "ck_audit_events_action" CHECK ("action" IN ('employee.created', 'review.created', 'review.updated', 'review.deleted')),
    CONSTRAINT "ck_audit_events_target_type" CHECK ("target_type" IN ('employee', 'review')),
    CONSTRAINT "ck_audit_events_changes_array" CHECK (jsonb_typeof("changes") = 'array')
);

-- CreateIndex
CREATE INDEX "idx_audit_events_employee_id_occurred_at" ON "audit_events"("employee_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_audit_events_actor_user_id" ON "audit_events"("actor_user_id");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "fk_audit_events_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "fk_audit_events_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append-only (data.md → Audit log): the application can only INSERT.
CREATE FUNCTION "audit_events_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (% rejected)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "trg_audit_events_no_update_delete"
  BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION "audit_events_append_only"();

CREATE TRIGGER "trg_audit_events_no_truncate"
  BEFORE TRUNCATE ON "audit_events"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_events_append_only"();
