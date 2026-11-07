-- Authors edit their comments on time-off requests (time-off module): when it was last edited.
ALTER TABLE "time_off_request_comments" ADD COLUMN "edited_at" TIMESTAMPTZ(3);
