ALTER TABLE "employees" ADD COLUMN "born_at" DATE;

ALTER TABLE "employees"
    ADD CONSTRAINT "ck_employees_born_at" CHECK ("born_at" >= DATE '1900-01-01');
