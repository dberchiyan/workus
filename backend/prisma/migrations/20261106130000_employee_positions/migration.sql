CREATE TABLE "position_categories" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_position_categories" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_position_categories_name" ON "position_categories"("name");

CREATE TABLE "positions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "category_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_positions" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_positions_title" ON "positions"("title");
CREATE INDEX "idx_positions_category_id" ON "positions"("category_id");

ALTER TABLE "positions" ADD CONSTRAINT "fk_positions_category_id" FOREIGN KEY ("category_id") REFERENCES "position_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
