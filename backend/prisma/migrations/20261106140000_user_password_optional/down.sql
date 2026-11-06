-- Fails while any account has no password; set or remove those first.
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
