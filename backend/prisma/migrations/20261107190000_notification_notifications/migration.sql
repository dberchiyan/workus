-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "recipient_user_id" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "actor_user_id" UUID,
    "subject_type" VARCHAR(32) NOT NULL,
    "subject_id" UUID NOT NULL,
    "params" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "pk_notifications" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notifications_recipient_user_id_created_at" ON "notifications"("recipient_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_actor_user_id" ON "notifications"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_subject_id_type" ON "notifications"("subject_id", "type");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_recipient_user_id" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unread count of one person (the bell polls it).
CREATE INDEX "idx_notifications_recipient_user_id_unread" ON "notifications"("recipient_user_id") WHERE "read_at" IS NULL;

ALTER TABLE "notifications" ADD CONSTRAINT "ck_notifications_type"
    CHECK ("type" IN ('TIME_OFF_REQUESTED', 'TIME_OFF_APPROVED', 'TIME_OFF_REJECTED',
                      'TIME_OFF_CANCELED', 'TIME_OFF_WITHDRAWN', 'TIME_OFF_ASSIGNED',
                      'TIME_OFF_COMMENTED', 'TIME_OFF_REMINDER'));
ALTER TABLE "notifications" ADD CONSTRAINT "ck_notifications_subject_type"
    CHECK ("subject_type" IN ('time_off_request'));
ALTER TABLE "notifications" ADD CONSTRAINT "ck_notifications_params_object"
    CHECK (jsonb_typeof("params") = 'object');
