-- Date of birth on the employee record (employee module): optional, for birthdays on the admin dashboard.
ALTER TABLE "employees" ADD COLUMN "date_of_birth" DATE;

ALTER TABLE "employees"
    ADD CONSTRAINT "ck_employees_date_of_birth" CHECK ("date_of_birth" >= DATE '1900-01-01');
