CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "terminated_on" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_employees" PRIMARY KEY ("id"),
    CONSTRAINT "ck_employees_terminated_on_after_start" CHECK ("terminated_on" IS NULL OR "terminated_on" >= "start_date")
);

CREATE UNIQUE INDEX "uq_employees_user_id" ON "employees"("user_id");
CREATE INDEX "idx_employees_position_id" ON "employees"("position_id");
CREATE INDEX "idx_employees_start_date" ON "employees"("start_date");
CREATE INDEX "idx_employees_terminated_on" ON "employees"("terminated_on");

ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_position_id" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "employee_responsibles" (
    "employee_id" UUID NOT NULL,
    "responsible_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "pk_employee_responsibles" PRIMARY KEY ("employee_id","responsible_user_id")
);

CREATE INDEX "idx_employee_responsibles_responsible_user_id" ON "employee_responsibles"("responsible_user_id");

ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "fk_employee_responsibles_responsible_user_id" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
