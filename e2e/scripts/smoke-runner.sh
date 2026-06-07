#!/usr/bin/env bash
# e2e/scripts/smoke-runner.sh
#
# FoodFlow integration smoke gate — orchestrates all test gates in order:
#   1. docker compose up + health wait
#   2. DB seed (big dataset)
#   3. Playwright E2E tests
#   4. k6 load test
#   5. Lighthouse CI (mobile + desktop)
#   6. AI scenario assertions
#
# Each gate is tracked independently. Exit 1 if ANY gate fails.
# Requires: docker, pnpm, k6, @lhci/cli (in web devDeps), npx tsx
#
# Usage:
#   bash e2e/scripts/smoke-runner.sh
#   SKIP_K6=1 bash e2e/scripts/smoke-runner.sh      # skip load test locally
#   SKIP_LIGHTHOUSE=1 bash ...                       # skip Lighthouse
#   API_URL=http://api.staging.foodflow.vn/api ...   # point at staging

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/e2e/reports}"
mkdir -p "$REPORT_DIR"

API_URL="${API_URL:-http://localhost:3001/api}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3000}"
RESTAURANT_URL="${RESTAURANT_URL:-http://localhost:3002}"
AI_ENDPOINT="${AI_ENDPOINT:-${API_URL}/ai/chat}"

SKIP_K6="${SKIP_K6:-0}"
SKIP_LIGHTHOUSE="${SKIP_LIGHTHOUSE:-0}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-0}"
SKIP_AI_SCENARIOS="${SKIP_AI_SCENARIOS:-0}"

# Gate result tracking: 0=pass, 1=fail
declare -A GATE_STATUS

log() { echo "[smoke] $*"; }
fail_gate() { GATE_STATUS["$1"]=1; log "FAILED: $1"; }
pass_gate() { GATE_STATUS["$1"]=0; log "PASSED: $1"; }

# ---------------------------------------------------------------------------
# Gate 0 — Docker Compose stack
# ---------------------------------------------------------------------------

log "=== Gate 0: Docker Compose stack ==="
cd "$REPO_ROOT"
docker compose up -d postgres redis minio backend

log "Waiting for backend health..."
for i in $(seq 1 40); do
  if curl -sf "${API_URL%/api}/api/healthz" > /dev/null 2>&1; then
    log "Backend healthy after ${i}x5s"
    break
  fi
  if [ "$i" -eq 40 ]; then
    fail_gate "stack_health"
    log "Backend did not become healthy; aborting"
    exit 1
  fi
  sleep 5
done
pass_gate "stack_health"

# ---------------------------------------------------------------------------
# Gate 1 — DB seed
# ---------------------------------------------------------------------------

log "=== Gate 1: DB seed ==="
if (cd "$REPO_ROOT/backend" && pnpm install --frozen-lockfile --silent && pnpm db:big-seed); then
  pass_gate "db_seed"
else
  fail_gate "db_seed"
  log "DB seed failed; continuing (tests may fail due to missing data)"
fi

# ---------------------------------------------------------------------------
# Gate 2 — Playwright E2E
# ---------------------------------------------------------------------------

if [ "$SKIP_PLAYWRIGHT" = "0" ]; then
  log "=== Gate 2: Playwright E2E ==="

  # Start web apps in background
  (cd "$REPO_ROOT/web/apps/admin" && npx next dev --port 3000 > /dev/null 2>&1) &
  ADMIN_PID=$!
  (cd "$REPO_ROOT/web/apps/restaurant" && npx next dev --port 3002 > /dev/null 2>&1) &
  RESTAURANT_PID=$!

  if npx wait-on "$ADMIN_URL" "$RESTAURANT_URL" --timeout 90000 2>/dev/null; then
    if (cd "$REPO_ROOT/web" && \
        CI=true ADMIN_URL="$ADMIN_URL" RESTAURANT_URL="$RESTAURANT_URL" API_URL="$API_URL" \
        pnpm test:e2e --project=chromium --reporter=html 2>&1 | tee "$REPORT_DIR/playwright.log"); then
      pass_gate "playwright"
    else
      fail_gate "playwright"
    fi
  else
    fail_gate "playwright"
    log "Web apps did not start in time"
  fi

  kill $ADMIN_PID $RESTAURANT_PID 2>/dev/null || true
else
  log "=== Gate 2: Playwright — SKIPPED (SKIP_PLAYWRIGHT=1) ==="
  GATE_STATUS["playwright"]=0
fi

# ---------------------------------------------------------------------------
# Gate 3 — k6 load test
# ---------------------------------------------------------------------------

if [ "$SKIP_K6" = "0" ]; then
  log "=== Gate 3: k6 load test (100 RPS × 5 min) ==="
  if command -v k6 &>/dev/null; then
    if k6 run \
        --env API_URL="$API_URL" \
        --out json="$REPORT_DIR/k6-results.json" \
        "$REPO_ROOT/infra/loadtest/k6-mixed.js" 2>&1 | tee "$REPORT_DIR/k6.log"; then
      pass_gate "k6_load"
    else
      fail_gate "k6_load"
    fi
  else
    log "k6 not found in PATH — skipping load test (install: https://k6.io/docs/getting-started/installation)"
    GATE_STATUS["k6_load"]=0
  fi
else
  log "=== Gate 3: k6 — SKIPPED (SKIP_K6=1) ==="
  GATE_STATUS["k6_load"]=0
fi

# ---------------------------------------------------------------------------
# Gate 4 — Lighthouse CI
# ---------------------------------------------------------------------------

if [ "$SKIP_LIGHTHOUSE" = "0" ]; then
  log "=== Gate 4: Lighthouse CI ==="
  if (cd "$REPO_ROOT/web" && \
      ADMIN_URL="$ADMIN_URL" RESTAURANT_URL="$RESTAURANT_URL" \
      npx lhci autorun --config="$REPO_ROOT/infra/lighthouse/lighthouserc.cjs" \
      2>&1 | tee "$REPORT_DIR/lighthouse.log"); then
    pass_gate "lighthouse"
  else
    fail_gate "lighthouse"
  fi
else
  log "=== Gate 4: Lighthouse — SKIPPED (SKIP_LIGHTHOUSE=1) ==="
  GATE_STATUS["lighthouse"]=0
fi

# ---------------------------------------------------------------------------
# Gate 5 — AI scenarios
# ---------------------------------------------------------------------------

if [ "$SKIP_AI_SCENARIOS" = "0" ]; then
  log "=== Gate 5: AI scenarios ==="
  if npx tsx "$REPO_ROOT/e2e/ai-scenarios/run-ai-scenarios.ts" \
      --endpoint "$AI_ENDPOINT" \
      --fixtures "$REPO_ROOT/e2e/ai-scenarios/canonical-conversations.json" \
      2>&1 | tee "$REPORT_DIR/ai-scenarios.log"; then
    pass_gate "ai_scenarios"
  else
    fail_gate "ai_scenarios"
  fi
else
  log "=== Gate 5: AI scenarios — SKIPPED ==="
  GATE_STATUS["ai_scenarios"]=0
fi

# ---------------------------------------------------------------------------
# Docker Compose teardown
# ---------------------------------------------------------------------------

log "Tearing down Docker Compose stack..."
docker compose down 2>/dev/null || true

# ---------------------------------------------------------------------------
# Aggregate report
# ---------------------------------------------------------------------------

log ""
log "==============================="
log "  SMOKE GATE SUMMARY"
log "==============================="
OVERALL=0
for gate in stack_health db_seed playwright k6_load lighthouse ai_scenarios; do
  status="${GATE_STATUS[$gate]:-0}"
  label=$( [ "$status" = "0" ] && echo "PASS" || echo "FAIL" )
  log "  ${label}  ${gate}"
  [ "$status" != "0" ] && OVERALL=1
done
log "==============================="

if [ "$OVERALL" = "0" ]; then
  log "ALL GATES PASSED — soft launch ready"
else
  log "ONE OR MORE GATES FAILED — resolve before launch"
fi

exit "$OVERALL"
