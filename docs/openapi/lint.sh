#!/usr/bin/env bash
set -euo pipefail

# ── Spectral OpenAPI Lint ──
# Dependencies: npm install -g @stoplight/spectral-cli
# Or via pnpm: pnpm add -D @stoplight/spectral-cli

SPECTRAL="$(which spectral 2>/dev/null || echo '')"
if [ -z "$SPECTRAL" ]; then
  # Try local pnpm bin
  SPECTRAL="$(node -e "try { console.log(require.resolve('@stoplight/spectral-cli/package.json')) } catch(e) {}" 2>/dev/null || echo '')"
  if [ -n "$SPECTRAL" ]; then
    SPECTRAL_DIR="$(dirname "$SPECTRAL")/bin/spectral"
  else
    echo "ERROR: spectral not found. Install with: npm install -g @stoplight/spectral-cli" >&2
    exit 1
  fi
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SPEC="${SCRIPT_DIR}/../openapi.yaml"

echo "Linting ${SPEC}..."
spectral lint "${SPEC}" --ruleset "${SCRIPT_DIR}/.spectral.yaml" --fail-severity error
echo "OpenAPI spec is valid."
