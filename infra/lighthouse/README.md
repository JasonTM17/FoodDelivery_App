# infra/lighthouse

Lighthouse CI configuration for FoodFlow web apps — performance, accessibility, and bundle size gate.

## Files

| File | Purpose |
|------|---------|
| `lighthouserc.cjs` | LHCI config: URLs, thresholds, upload target |

## Quick start

Prerequisites: web apps running on `localhost:3000` (admin) and `localhost:3002` (restaurant).

```bash
# Install workspace dependencies (LHCI is already in web devDependencies)
cd web && pnpm install --frozen-lockfile

# Mobile audit (default)
cd web && pnpm exec lhci autorun --config=../infra/lighthouse/lighthouserc.cjs

# Desktop audit
LHCI_FORM_FACTOR=desktop cd web && pnpm exec lhci autorun --config=../infra/lighthouse/lighthouserc.cjs
```

## Thresholds

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Performance score | ≥ 0.80 | ≥ 0.90 |
| Accessibility score | ≥ 0.90 | ≥ 0.90 |
| Best-practices | ≥ 0.80 (warn) | ≥ 0.80 (warn) |
| LCP | ≤ 2500 ms | ≤ 2500 ms |
| TBT (INP proxy) | ≤ 200 ms | ≤ 200 ms |
| CLS | ≤ 0.1 | ≤ 0.1 |
| Initial JS transfer | ≤ 200 KB | ≤ 200 KB |

Assertions marked `error` fail the CI job. Assertions marked `warn` produce warnings but do not fail.

## URLs audited

- `http://localhost:3000` — admin home
- `http://localhost:3000/orders` — admin orders list
- `http://localhost:3002` — restaurant home
- `http://localhost:3002/orders` — restaurant orders list

Override via env vars:

```bash
ADMIN_URL=http://localhost:3000 RESTAURANT_URL=http://localhost:3002 pnpm exec lhci autorun ...
```

## LHCI server (optional)

Set `LHCI_SERVER_URL` + `LHCI_TOKEN` to upload results to a self-hosted LHCI server instead of temporary public storage.

## CI

Runs in `.github/workflows/integration.yml` as the `lighthouse` job (both mobile and desktop passes).
Skip with `SKIP_LIGHTHOUSE=1` locally or the `skip_lighthouse` workflow dispatch input.
