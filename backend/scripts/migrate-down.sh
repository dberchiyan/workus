#!/usr/bin/env sh
# Incidents only: applies <migration>/down.sql and marks the migration rolled back.
set -eu
migration="${1:?usage: npm run db:migrate:down -- <migration_folder_name>}"
prisma db execute --file "prisma/migrations/${migration}/down.sql"
prisma migrate resolve --rolled-back "${migration}"
