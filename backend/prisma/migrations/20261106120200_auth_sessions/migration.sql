CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "csrf_token_hash" CHAR(64) NOT NULL,
    "authorities" VARCHAR(32)[],
    "client_type" VARCHAR(16) NOT NULL,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pk_sessions" PRIMARY KEY ("id"),
    CONSTRAINT "ck_sessions_client_type" CHECK ("client_type" IN ('web', 'mobile'))
);

CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "sessions"("token_hash");
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");
CREATE INDEX "idx_sessions_absolute_expires_at" ON "sessions"("absolute_expires_at");
CREATE INDEX "idx_sessions_idle_expires_at" ON "sessions"("idle_expires_at");

ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
