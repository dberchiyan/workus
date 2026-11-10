-- One transaction: a failure leaves the shared catalogue as it was.
BEGIN;

-- Company structure (Settings → Company structure): departments (position_categories) and their
-- positions belong to an organisation instead of one shared catalogue. Every company gets its own
-- copy of the catalogue; employees move to their company's copy of the same position.

-- Names are unique per organisation from now on (the copies repeat them).
DROP INDEX "uq_position_categories_name";
DROP INDEX "uq_positions_title";
DROP INDEX "idx_positions_category_id";
DROP INDEX "idx_employees_position_id";

ALTER TABLE "position_categories" ADD COLUMN "organisation_id" UUID, ADD COLUMN "source_id" UUID;
ALTER TABLE "positions" ADD COLUMN "organisation_id" UUID, ADD COLUMN "source_id" UUID;

-- Every company (never the platform's own organisation) copies the shared departments…
INSERT INTO "position_categories" ("organisation_id", "name", "sort_order", "updated_at", "source_id")
SELECT o."id", c."name", c."sort_order", CURRENT_TIMESTAMP, c."id"
FROM "organisations" o
CROSS JOIN "position_categories" c
WHERE o."is_platform" = FALSE AND c."organisation_id" IS NULL;

-- …and their positions, under its own copy of the department.
INSERT INTO "positions" ("organisation_id", "category_id", "title", "updated_at", "source_id")
SELECT copy."organisation_id", copy."id", p."title", CURRENT_TIMESTAMP, p."id"
FROM "positions" p
JOIN "position_categories" copy ON copy."source_id" = p."category_id"
WHERE p."organisation_id" IS NULL;

-- Employees take their company's copy of the position they hold.
UPDATE "employees" e
SET "position_id" = p."id"
FROM "positions" p
WHERE p."organisation_id" = e."organisation_id" AND p."source_id" = e."position_id";

-- The shared catalogue is gone.
ALTER TABLE "employees" DROP CONSTRAINT "fk_employees_position_id";
ALTER TABLE "positions" DROP CONSTRAINT "fk_positions_category_id";
DELETE FROM "positions" WHERE "organisation_id" IS NULL;
DELETE FROM "position_categories" WHERE "organisation_id" IS NULL;

ALTER TABLE "position_categories" DROP COLUMN "source_id", ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "positions" DROP COLUMN "source_id", ALTER COLUMN "organisation_id" SET NOT NULL;

CREATE UNIQUE INDEX "uq_position_categories_organisation_id_name" ON "position_categories"("organisation_id", "name");
CREATE UNIQUE INDEX "uq_position_categories_organisation_id_id" ON "position_categories"("organisation_id", "id");
CREATE UNIQUE INDEX "uq_positions_organisation_id_title" ON "positions"("organisation_id", "title");
CREATE UNIQUE INDEX "uq_positions_organisation_id_id" ON "positions"("organisation_id", "id");
CREATE INDEX "idx_positions_organisation_id_category_id" ON "positions"("organisation_id", "category_id");
CREATE INDEX "idx_employees_organisation_id_position_id" ON "employees"("organisation_id", "position_id");

ALTER TABLE "position_categories" ADD CONSTRAINT "fk_position_categories_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "positions" ADD CONSTRAINT "fk_positions_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Composite: a position and its department, an employee and their position are always of one organisation.
ALTER TABLE "positions" ADD CONSTRAINT "fk_positions_category_id" FOREIGN KEY ("organisation_id", "category_id") REFERENCES "position_categories"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_position_id" FOREIGN KEY ("organisation_id", "position_id") REFERENCES "positions"("organisation_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
