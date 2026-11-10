-- Back to one shared catalogue: the first company's departments and positions (by name / title)
-- become the shared ones; other companies' employees move to the same title there. Positions or
-- departments a company added on its own are lost unless the first company has the same title.
ALTER TABLE "employees" DROP CONSTRAINT "fk_employees_position_id";
ALTER TABLE "positions" DROP CONSTRAINT "fk_positions_category_id";
ALTER TABLE "positions" DROP CONSTRAINT "fk_positions_organisation_id";
ALTER TABLE "position_categories" DROP CONSTRAINT "fk_position_categories_organisation_id";
DROP INDEX "idx_employees_organisation_id_position_id";
DROP INDEX "idx_positions_organisation_id_category_id";
DROP INDEX "uq_positions_organisation_id_id";
DROP INDEX "uq_positions_organisation_id_title";
DROP INDEX "uq_position_categories_organisation_id_id";
DROP INDEX "uq_position_categories_organisation_id_name";

WITH keeper AS (
    SELECT "organisation_id" FROM "positions" ORDER BY "created_at", "organisation_id" LIMIT 1
)
UPDATE "employees" e
SET "position_id" = kept."id"
FROM "positions" own, "positions" kept, keeper
WHERE own."id" = e."position_id"
  AND kept."organisation_id" = keeper."organisation_id"
  AND kept."title" = own."title";

DELETE FROM "positions" p
WHERE p."organisation_id" <> (SELECT "organisation_id" FROM "positions" ORDER BY "created_at", "organisation_id" LIMIT 1);
DELETE FROM "position_categories" c
WHERE NOT EXISTS (SELECT 1 FROM "positions" p WHERE p."category_id" = c."id");

ALTER TABLE "positions" DROP COLUMN "organisation_id";
ALTER TABLE "position_categories" DROP COLUMN "organisation_id";
CREATE UNIQUE INDEX "uq_position_categories_name" ON "position_categories"("name");
CREATE UNIQUE INDEX "uq_positions_title" ON "positions"("title");
CREATE INDEX "idx_positions_category_id" ON "positions"("category_id");
CREATE INDEX "idx_employees_position_id" ON "employees"("position_id");
ALTER TABLE "positions" ADD CONSTRAINT "fk_positions_category_id" FOREIGN KEY ("category_id") REFERENCES "position_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_position_id" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
