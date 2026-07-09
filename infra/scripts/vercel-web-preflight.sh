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

ISSUES_FILE="${TMPDIR:-/tmp}/foodflow-vercel-preflight-$$.issues"
: > "$ISSUES_FILE"
NODE_SHIM_DIR=""
trap 'rm -f "$ISSUES_FILE"; if [ -n "${NODE_SHIM_DIR:-}" ]; then rm -rf "$NODE_SHIM_DIR"; fi' EXIT

add_issue() {
  printf '%s\n' "$1" >> "$ISSUES_FILE"
}

NODE_BIN="${NODE_BIN:-node}"
if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  if command -v node.exe >/dev/null 2>&1; then
    NODE_EXE="$(command -v node.exe)"
    NODE_SHIM_DIR="${TMPDIR:-/tmp}/foodflow-node-shim-$$"
    mkdir -p "$NODE_SHIM_DIR"
    printf '#!/bin/sh\nexec "%s" "$@"\n' "$NODE_EXE" > "$NODE_SHIM_DIR/node"
    chmod +x "$NODE_SHIM_DIR/node"
    PATH="$NODE_SHIM_DIR:$PATH"
    export PATH
    NODE_BIN="node"
  else
  echo "Node.js is required for Vercel CLI and JSON parsing." >&2
  exit 1
  fi
fi

VERCEL_BIN="${VERCEL_BIN:-vercel}"
VERCEL_MODE="native"
if [ "$VERCEL_BIN" = "vercel" ] && command -v cmd.exe >/dev/null 2>&1 && command -v vercel.cmd >/dev/null 2>&1; then
  VERCEL_MODE="cmd"
elif ! command -v "$VERCEL_BIN" >/dev/null 2>&1; then
  echo "Vercel CLI is required. Install/authenticate it before running web preflight." >&2
  exit 1
fi

invoke_vercel() {
  if [ "$VERCEL_MODE" = "cmd" ]; then
    cmd.exe /C vercel "$@"
  else
    "$VERCEL_BIN" "$@"
  fi
}

invoke_vercel --version >/dev/null 2>&1 || {
  add_issue "Vercel CLI availability/auth: Vercel CLI is required and must be authenticated before running preflight."
}

assert_contains() {
  label="$1"
  expected="$2"
  text="$3"
  printf '%s' "$text" | grep -F "$label" >/dev/null || {
    echo "Missing Vercel project setting label: $label" >&2
    return 1
  }
  printf '%s' "$text" | grep -F "$expected" >/dev/null || {
    echo "Vercel project setting mismatch: expected $label = $expected" >&2
    return 1
  }
}

assert_env_names() {
  project_label="$1"
  required="$2"
  json="$3"
  "$NODE_BIN" -e '
const fs = require("fs");
const [projectLabel, requiredEnv] = process.argv.slice(1);
const input = fs.readFileSync(0, "utf8");
const start = input.indexOf("{");
const end = input.lastIndexOf("}");
if (start < 0 || end < start) throw new Error("Expected JSON object in Vercel CLI output");
const payload = JSON.parse(input.slice(start, end + 1));
const names = new Set((payload.envs || []).map((env) => env.key));
const missing = requiredEnv.split(/\s+/).filter(Boolean).filter((name) => !names.has(name));
if (missing.length) {
  console.error(`${projectLabel} is missing production env vars: ${missing.join(", ")}`);
  process.exit(1);
}
' "$project_label" "$required" <<EOF
$json
EOF
}

echo "Checking Vercel API project settings for $API_VERCEL_PROJECT..."
if ! API_INSPECT="$(invoke_vercel project inspect "$API_VERCEL_PROJECT" --no-color 2>&1)"; then
  add_issue "Vercel API project settings: $API_INSPECT"
else
  assert_contains "Root Directory" "backend" "$API_INSPECT" || add_issue "Vercel API project settings: Root Directory must be backend"
  assert_contains "Framework Preset" "Other" "$API_INSPECT" || add_issue "Vercel API project settings: Framework Preset must be Other"
  assert_contains "Build Command" "pnpm prisma generate && pnpm build" "$API_INSPECT" || add_issue "Vercel API project settings: Build Command must be pnpm prisma generate && pnpm build"
  assert_contains "Install Command" "pnpm install --frozen-lockfile" "$API_INSPECT" || add_issue "Vercel API project settings: Install Command must be pnpm install --frozen-lockfile"
fi

echo "Checking Vercel API production env names..."
if ! API_ENV_JSON="$(invoke_vercel api "/v9/projects/$API_VERCEL_PROJECT/env?target=production" --raw 2>&1)"; then
  add_issue "Vercel API production env names: $API_ENV_JSON"
elif ! API_ENV_ERR="$(assert_env_names "API Vercel project" "$API_REQUIRED_ENV" "$API_ENV_JSON" 2>&1)"; then
  add_issue "Vercel API production env names: $API_ENV_ERR"
fi

echo "Checking Vercel Admin project settings for $ADMIN_VERCEL_PROJECT..."
if ! ADMIN_INSPECT="$(invoke_vercel project inspect "$ADMIN_VERCEL_PROJECT" --no-color 2>&1)"; then
  add_issue "Vercel Admin project settings: $ADMIN_INSPECT"
else
  assert_contains "Root Directory" "web/apps/admin" "$ADMIN_INSPECT" || add_issue "Vercel Admin project settings: Root Directory must be web/apps/admin"
  assert_contains "Framework Preset" "Next.js" "$ADMIN_INSPECT" || add_issue "Vercel Admin project settings: Framework Preset must be Next.js"
  assert_contains "Build Command" "cd ../.. && pnpm --filter foodflow-admin build" "$ADMIN_INSPECT" || add_issue "Vercel Admin project settings: Build Command must be cd ../.. && pnpm --filter foodflow-admin build"
  assert_contains "Install Command" "cd ../.. && pnpm install --frozen-lockfile" "$ADMIN_INSPECT" || add_issue "Vercel Admin project settings: Install Command must be cd ../.. && pnpm install --frozen-lockfile"
  assert_contains "Output Directory" ".next" "$ADMIN_INSPECT" || add_issue "Vercel Admin project settings: Output Directory must be .next"
fi

echo "Checking Vercel Admin production env names..."
if ! ADMIN_ENV_JSON="$(invoke_vercel api "/v9/projects/$ADMIN_VERCEL_PROJECT/env?target=production" --raw 2>&1)"; then
  add_issue "Vercel Admin production env names: $ADMIN_ENV_JSON"
elif ! ADMIN_ENV_ERR="$(assert_env_names "Admin Vercel project" "$ADMIN_REQUIRED_ENV" "$ADMIN_ENV_JSON" 2>&1)"; then
  add_issue "Vercel Admin production env names: $ADMIN_ENV_ERR"
fi

echo "Checking Vercel Restaurant project settings for $RESTAURANT_VERCEL_PROJECT..."
if ! RESTAURANT_INSPECT="$(invoke_vercel project inspect "$RESTAURANT_VERCEL_PROJECT" --no-color 2>&1)"; then
  add_issue "Vercel Restaurant project settings: $RESTAURANT_INSPECT"
else
  assert_contains "Root Directory" "web/apps/restaurant" "$RESTAURANT_INSPECT" || add_issue "Vercel Restaurant project settings: Root Directory must be web/apps/restaurant"
  assert_contains "Framework Preset" "Next.js" "$RESTAURANT_INSPECT" || add_issue "Vercel Restaurant project settings: Framework Preset must be Next.js"
  assert_contains "Build Command" "cd ../.. && pnpm --filter restaurant build" "$RESTAURANT_INSPECT" || add_issue "Vercel Restaurant project settings: Build Command must be cd ../.. && pnpm --filter restaurant build"
  assert_contains "Install Command" "cd ../.. && pnpm install --frozen-lockfile" "$RESTAURANT_INSPECT" || add_issue "Vercel Restaurant project settings: Install Command must be cd ../.. && pnpm install --frozen-lockfile"
  assert_contains "Output Directory" ".next" "$RESTAURANT_INSPECT" || add_issue "Vercel Restaurant project settings: Output Directory must be .next"
fi

echo "Checking Vercel Restaurant production env names for $RESTAURANT_VERCEL_PROJECT..."
if ! RESTAURANT_ENV_JSON="$(invoke_vercel api "/v9/projects/$RESTAURANT_VERCEL_PROJECT/env?target=production" --raw 2>&1)"; then
  add_issue "Vercel Restaurant production env names: $RESTAURANT_ENV_JSON"
elif ! RESTAURANT_ENV_ERR="$(assert_env_names "Restaurant Vercel project" "$RESTAURANT_REQUIRED_ENV" "$RESTAURANT_ENV_JSON" 2>&1)"; then
  add_issue "Vercel Restaurant production env names: $RESTAURANT_ENV_ERR"
fi

if [ -s "$ISSUES_FILE" ]; then
  echo "Vercel production preflight failed:" >&2
  sed 's/^/  - /' "$ISSUES_FILE" >&2
  exit 1
fi

echo "Vercel web preflight passed. Next gated step: deploy only saved, tested versions."
