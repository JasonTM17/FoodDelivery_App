#!/bin/sh
# FoodFlow Vercel production preflight.
# Verifies API/Admin/Restaurant project and production env readiness without printing
# environment variable values or deploying.
set -eu

API_VERCEL_PROJECT="${API_VERCEL_PROJECT:-foodflow-api}"
ADMIN_VERCEL_PROJECT="${ADMIN_VERCEL_PROJECT:-food-delivery-app}"
RESTAURANT_VERCEL_PROJECT="${RESTAURANT_VERCEL_PROJECT:-${RESTAURANT_VERCEL_PROJECT_ID:-foodflow-restaurant}}"

API_REQUIRED_ENV="NODE_ENV DATABASE_URL DIRECT_URL REDIS_URL REALTIME_PROVIDER STORAGE_PROVIDER QUEUE_PROVIDER SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET SUPABASE_STORAGE_BUCKET CRON_SECRET JWT_SECRET JWT_REFRESH_SECRET PASSWORD_RESET_URL_BASE CORS_ORIGINS DELIVERY_BASE_FEE_VND GOOGLE_MAPS_API_KEY OSRM_URL DEEPSEEK_API_KEY SEPAY_API_KEY SEPAY_ACCOUNT_NUMBER SEPAY_WEBHOOK_SECRET WEBHOOK_SECRET SMTP_HOST SMTP_USER SMTP_PASS SMTP_FROM FCM_SERVER_KEY TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM_NUMBER"
ADMIN_REQUIRED_ENV="NEXT_PUBLIC_API_URL NEXT_PUBLIC_ADMIN_URL NEXT_PUBLIC_GOOGLE_MAPS_KEY NEXT_PUBLIC_REALTIME_PROVIDER NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY"
RESTAURANT_REQUIRED_ENV="NEXT_PUBLIC_API_URL NEXT_PUBLIC_RESTAURANT_URL NEXT_PUBLIC_GOOGLE_MAPS_KEY NEXT_PUBLIC_REALTIME_PROVIDER NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY"

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required for Vercel CLI and JSON parsing." >&2
  exit 1
}

command -v vercel >/dev/null 2>&1 || {
  echo "Vercel CLI is required. Install/authenticate it before running web preflight." >&2
  exit 1
}

vercel --version >/dev/null 2>&1 || {
  echo "Vercel CLI is required and must be authenticated before running preflight." >&2
  exit 1
}

assert_contains() {
  label="$1"
  expected="$2"
  text="$3"
  printf '%s' "$text" | grep -F "$label" >/dev/null || {
    echo "Missing Vercel project setting label: $label" >&2
    exit 1
  }
  printf '%s' "$text" | grep -F "$expected" >/dev/null || {
    echo "Vercel project setting mismatch: expected $label = $expected" >&2
    exit 1
  }
}

assert_env_names() {
  project_label="$1"
  required="$2"
  json="$3"
  PROJECT_LABEL="$project_label" REQUIRED_ENV="$required" node -e '
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
const start = input.indexOf("{");
const end = input.lastIndexOf("}");
if (start < 0 || end < start) throw new Error("Expected JSON object in Vercel CLI output");
const payload = JSON.parse(input.slice(start, end + 1));
const names = new Set((payload.envs || []).map((env) => env.key));
const missing = process.env.REQUIRED_ENV.split(/\s+/).filter(Boolean).filter((name) => !names.has(name));
if (missing.length) {
  throw new Error(`${process.env.PROJECT_LABEL} is missing production env vars: ${missing.join(", ")}`);
}
' <<EOF
$json
EOF
}

echo "Checking Vercel API project settings for $API_VERCEL_PROJECT..."
API_INSPECT="$(vercel project inspect "$API_VERCEL_PROJECT" --no-color 2>&1)"
assert_contains "Root Directory" "backend" "$API_INSPECT"
assert_contains "Framework Preset" "Other" "$API_INSPECT"
assert_contains "Build Command" "pnpm prisma generate && pnpm build" "$API_INSPECT"
assert_contains "Install Command" "pnpm install --frozen-lockfile" "$API_INSPECT"

echo "Checking Vercel API production env names..."
API_ENV_JSON="$(vercel api "/v9/projects/$API_VERCEL_PROJECT/env?target=production" --raw 2>&1)"
assert_env_names "API Vercel project" "$API_REQUIRED_ENV" "$API_ENV_JSON"

echo "Checking Vercel Admin project settings for $ADMIN_VERCEL_PROJECT..."
ADMIN_INSPECT="$(vercel project inspect "$ADMIN_VERCEL_PROJECT" --no-color 2>&1)"
assert_contains "Root Directory" "web/apps/admin" "$ADMIN_INSPECT"
assert_contains "Framework Preset" "Next.js" "$ADMIN_INSPECT"
assert_contains "Build Command" "cd ../.. && pnpm --filter foodflow-admin build" "$ADMIN_INSPECT"
assert_contains "Install Command" "cd ../.. && pnpm install --frozen-lockfile" "$ADMIN_INSPECT"
assert_contains "Output Directory" ".next" "$ADMIN_INSPECT"

echo "Checking Vercel Admin production env names..."
ADMIN_ENV_JSON="$(vercel api "/v9/projects/$ADMIN_VERCEL_PROJECT/env?target=production" --raw 2>&1)"
assert_env_names "Admin Vercel project" "$ADMIN_REQUIRED_ENV" "$ADMIN_ENV_JSON"

echo "Checking Vercel Restaurant project settings for $RESTAURANT_VERCEL_PROJECT..."
RESTAURANT_INSPECT="$(vercel project inspect "$RESTAURANT_VERCEL_PROJECT" --no-color 2>&1)"
assert_contains "Root Directory" "web/apps/restaurant" "$RESTAURANT_INSPECT"
assert_contains "Framework Preset" "Next.js" "$RESTAURANT_INSPECT"
assert_contains "Build Command" "cd ../.. && pnpm --filter restaurant build" "$RESTAURANT_INSPECT"
assert_contains "Install Command" "cd ../.. && pnpm install --frozen-lockfile" "$RESTAURANT_INSPECT"
assert_contains "Output Directory" ".next" "$RESTAURANT_INSPECT"

echo "Checking Vercel Restaurant production env names for $RESTAURANT_VERCEL_PROJECT..."
RESTAURANT_ENV_JSON="$(vercel api "/v9/projects/$RESTAURANT_VERCEL_PROJECT/env?target=production" --raw 2>&1)"
assert_env_names "Restaurant Vercel project" "$RESTAURANT_REQUIRED_ENV" "$RESTAURANT_ENV_JSON"

echo "Vercel web preflight passed. Next gated step: deploy only saved, tested versions."
