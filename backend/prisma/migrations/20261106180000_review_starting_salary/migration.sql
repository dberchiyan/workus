-- The starting salary of an employee is a review of kind STARTING: one per employee, always completed.
ALTER TABLE "employee_reviews" ADD COLUMN "kind" VARCHAR(16) NOT NULL DEFAULT 'REGULAR';

ALTER TABLE "employee_reviews"
    ADD CONSTRAINT "ck_employee_reviews_kind" CHECK ("kind" IN ('STARTING', 'REGULAR')),
    ADD CONSTRAINT "ck_employee_reviews_starting_completed" CHECK ("kind" <> 'STARTING' OR "status" = 'COMPLETED');

CREATE UNIQUE INDEX "uq_employee_reviews_employee_id_starting" ON "employee_reviews"("employee_id") WHERE "kind" = 'STARTING';
