CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "key" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "status_code" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pk_idempotency_keys" PRIMARY KEY ("id")
);

-- Leading user_id also serves the foreign key.
CREATE UNIQUE INDEX "uq_idempotency_keys_user_id_key" ON "idempotency_keys"("user_id", "key");
CREATE INDEX "idx_idempotency_keys_expires_at" ON "idempotency_keys"("expires_at");

ALTER TABLE "idempotency_keys" ADD CONSTRAINT "fk_idempotency_keys_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
