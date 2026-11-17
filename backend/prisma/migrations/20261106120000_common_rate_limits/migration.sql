CREATE TABLE "rate_limits" (
    "key" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "expire" BIGINT,

    CONSTRAINT "pk_rate_limits" PRIMARY KEY ("key")
);
