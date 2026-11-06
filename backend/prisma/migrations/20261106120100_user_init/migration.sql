CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_users" PRIMARY KEY ("id"),
    CONSTRAINT "ck_users_role" CHECK ("role" IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
    CONSTRAINT "ck_users_email_lower_case" CHECK ("email" = lower("email"))
);

CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");
