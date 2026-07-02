#!/usr/bin/env bash
set -euo pipefail

# Spectral OpenAPI lint.
# Dependencies: npm install -g @stoplight/spectral-cli
# Or add @stoplight/spectral-cli as a workspace dev dependency.

SPECTRAL_BIN="$(command -v spectral 2>/dev/null || true)"
if [ -z "$SPECTRAL_BIN" ]; then
  SPECTRAL_PACKAGE="$(node -e "try { console.log(require.resolve('@stoplight/spectral-cli/package.json')) } catch(e) {}" 2>/dev/null || true)"
  if [ -n "$SPECTRAL_PACKAGE" ]; then
    SPECTRAL_BIN="$(dirname "$SPECTRAL_PACKAGE")/bin/spectral"
  fi
fi

if [ -z "$SPECTRAL_BIN" ] || [ ! -x "$SPECTRAL_BIN" ]; then
  echo "ERROR: spectral not found. Install with: npm install -g @stoplight/spectral-cli" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SPEC="${SCRIPT_DIR}/../openapi.yaml"
RULESET="${SCRIPT_DIR}/.spectral.yaml"

echo "Linting ${SPEC}..."
"$SPECTRAL_BIN" lint "$SPEC" --ruleset "$RULESET" --fail-severity error
echo "OpenAPI spec is valid."
