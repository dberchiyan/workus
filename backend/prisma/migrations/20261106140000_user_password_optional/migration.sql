-- Accounts created by an admin have no password until the person sets one (invitation flow).
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
