CREATE TABLE "employee_reviews" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "employee_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "review_date" DATE NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "salary_amount" DECIMAL(19,4),
    "salary_currency" CHAR(3),
    "feedback_hr" VARCHAR(2000),
    "feedback_lead" VARCHAR(2000),
    "feedback_team" VARCHAR(2000),
    "feedback_client" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_employee_reviews" PRIMARY KEY ("id"),
    CONSTRAINT "ck_employee_reviews_status" CHECK ("status" IN ('COMPLETED', 'SCHEDULED', 'CANCELED')),
    -- Amount and currency travel together; a completed review always records the salary.
    CONSTRAINT "ck_employee_reviews_salary_pair" CHECK (("salary_amount" IS NULL) = ("salary_currency" IS NULL)),
    CONSTRAINT "ck_employee_reviews_completed_salary" CHECK ("status" <> 'COMPLETED' OR "salary_amount" IS NOT NULL),
    CONSTRAINT "ck_employee_reviews_salary_positive" CHECK ("salary_amount" IS NULL OR "salary_amount" > 0)
);

CREATE INDEX "idx_employee_reviews_employee_id_review_date" ON "employee_reviews"("employee_id", "review_date");

ALTER TABLE "employee_reviews" ADD CONSTRAINT "fk_employee_reviews_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "employee_review_responsibles" (
    "review_id" UUID NOT NULL,
    "responsible_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "pk_employee_review_responsibles" PRIMARY KEY ("review_id","responsible_user_id")
);

CREATE INDEX "idx_employee_review_responsibles_responsible_user_id" ON "employee_review_responsibles"("responsible_user_id");

ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_review_id" FOREIGN KEY ("review_id") REFERENCES "employee_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_review_responsibles" ADD CONSTRAINT "fk_employee_review_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
