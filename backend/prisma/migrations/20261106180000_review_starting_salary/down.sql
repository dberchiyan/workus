DROP INDEX IF EXISTS "uq_employee_reviews_employee_id_starting";
ALTER TABLE "employee_reviews"
    DROP CONSTRAINT IF EXISTS "ck_employee_reviews_starting_completed",
    DROP CONSTRAINT IF EXISTS "ck_employee_reviews_kind",
    DROP COLUMN IF EXISTS "kind";
