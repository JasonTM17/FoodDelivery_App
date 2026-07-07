#!/bin/sh
# FoodFlow Supabase production preflight.
# Verifies CLI/auth/project/env/migration readiness without printing secrets or
# deploying schema changes.
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

require_env() {
  name="$1"
  value="$(printenv "$name" || true)"
  if [ -z "$value" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

reject_local_url() {
  name="$1"
  value="$(printenv "$name" || true)"
  case "$value" in
    *localhost*|*127.0.0.1*|*0.0.0.0*)
      echo "$name must point at the production Supabase Postgres endpoint, not a local database." >&2
      exit 1
      ;;
  esac
}

echo "Checking Supabase CLI availability..."
npx supabase --version >/dev/null

require_env SUPABASE_ACCESS_TOKEN
require_env SUPABASE_PROJECT_REF
require_env DATABASE_URL
require_env DIRECT_URL
reject_local_url DATABASE_URL
reject_local_url DIRECT_URL

echo "Checking Supabase account/project access..."
PROJECTS="$(npx supabase projects list --output json)"
printf '%s' "$PROJECTS" | grep -q "\"id\"[[:space:]]*:[[:space:]]*\"$SUPABASE_PROJECT_REF\"" || {
  echo "SUPABASE_PROJECT_REF is not visible to the authenticated Supabase account." >&2
  exit 1
}

echo "Validating Prisma schema against configured production URLs..."
cd "$REPO_ROOT/backend"
pnpm exec prisma validate --schema prisma/schema.prisma

echo "Supabase preflight passed. Next gated step: pnpm db:migrate:prod"
