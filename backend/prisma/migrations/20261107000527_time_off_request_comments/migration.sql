-- Admins' comments on time-off requests (time-off module); index for the admin request lists.
CREATE TABLE "time_off_request_comments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "request_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_time_off_request_comments" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_time_off_request_comments_request_id_created_at" ON "time_off_request_comments"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_time_off_request_comments_author_id" ON "time_off_request_comments"("author_id");

-- CreateIndex
CREATE INDEX "idx_time_off_requests_status_created_at" ON "time_off_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_request_id" FOREIGN KEY ("request_id") REFERENCES "time_off_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_request_comments" ADD CONSTRAINT "fk_time_off_request_comments_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_off_request_comments"
    ADD CONSTRAINT "ck_time_off_request_comments_body" CHECK (length(btrim("body")) > 0);
