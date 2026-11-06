#!/usr/bin/env sh
# Fails when openapi.json is stale.
set -eu
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
node dist/openapi-generate.js "$tmp"
if ! diff -q openapi.json "$tmp" >/dev/null; then
  echo "openapi.json is stale — run npm run openapi:generate" >&2
  exit 1
fi
