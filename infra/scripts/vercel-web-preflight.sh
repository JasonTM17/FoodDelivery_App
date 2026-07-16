#!/bin/sh
# FoodFlow Vercel dashboard preflight.
# Verifies Admin/Restaurant project and production env readiness without printing
# environment variable values or deploying. The API runs on Railway.
set -eu

ADMIN_VERCEL_PROJECT="${ADMIN_VERCEL_PROJECT:-food-delivery-app}"
RESTAURANT_VERCEL_PROJECT="${RESTAURANT_VERCEL_PROJECT:-${RESTAURANT_VERCEL_PROJECT_ID:-foodflow-restaurant}}"

ADMIN_REQUIRED_ENV="NEXT_PUBLIC_API_URL NEXT_PUBLIC_WS_URL NEXT_PUBLIC_ADMIN_URL NEXT_PUBLIC_MAP_PROVIDER NEXT_PUBLIC_MAP_STYLE_URL NEXT_PUBLIC_REALTIME_PROVIDER NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
RESTAURANT_REQUIRED_ENV="NEXT_PUBLIC_API_URL NEXT_PUBLIC_WS_URL NEXT_PUBLIC_RESTAURANT_URL NEXT_PUBLIC_MAP_PROVIDER NEXT_PUBLIC_MAP_STYLE_URL NEXT_PUBLIC_REALTIME_PROVIDER NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

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
const entries = payload.envs || [];
const names = new Set(entries.map((env) => env.key));
const missing = requiredEnv.split(/\s+/).filter(Boolean).filter((name) => !names.has(name));
if (missing.length) {
  console.error(`${projectLabel} is missing production env vars: ${missing.join(", ")}`);
  process.exit(1);
}
const required = new Set(requiredEnv.split(/\s+/).filter(Boolean));
const nonAuditable = entries
  .filter((env) => required.has(env.key) && env.type === "sensitive")
  .map((env) => env.key);
if (nonAuditable.length) {
  console.error(`${projectLabel} stores public build vars as non-auditable sensitive values: ${nonAuditable.join(", ")}`);
  process.exit(1);
}
' "$project_label" "$required" <<EOF
$json
EOF
}

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
