# FoodFlow Web

## Purpose

`web/` is a pnpm 11 Turborepo for the FoodFlow dashboards:

- `apps/admin`: platform operations, live driver map, restaurants, users, orders, promotions, support, audit logs, exports, settings, and AI monitor.
- `apps/restaurant`: merchant order queue, live delivery tracking map, menu, categories, reviews, revenue, promotions, staff, profile, operating hours, insights, and notifications.
- `packages/api-client`: shared web API client and generated/contract types.
- `packages/ui` and `packages/i18n`: shared UI and localization utilities.

Both dashboards use Next.js 14, React 18, next-intl locale routes, and the NestJS backend API.

## Runtime URLs

| Dashboard | Port | Local URL |
|---|---:|---|
| Admin | 3000 | `http://localhost:3000` |
| Restaurant | 3002 | `http://localhost:3002` |
| Backend API | 3001 | `http://localhost:3001/api` |
| WebSocket | 3001 | `ws://localhost:3001` |

## Environment Variables

Each app uses an ignored `.env.local` copied from its example file.

### Admin

| Name | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | Yes | Use `development` for local/CI localhost builds; use `production` for real public deployments |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | Socket.IO gateway URL |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | Public Admin base URL for metadata and canonical links |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Only for live map | Browser Google Maps key. Restrict by HTTP referrer. |

### Restaurant

| Name | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | Yes | Use `development` for local/CI localhost builds; use `production` for real public deployments |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | Socket.IO gateway URL |
| `NEXT_PUBLIC_RESTAURANT_URL` | Yes | Public Restaurant base URL for metadata and canonical links |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Only for live map locally; required in production | Browser Google Maps key for order tracking. Restrict by HTTP referrer. |

## Run Locally

```bash
cd web
pnpm install --frozen-lockfile
Copy-Item apps/admin/.env.example apps/admin/.env.local
Copy-Item apps/restaurant/.env.example apps/restaurant/.env.local
pnpm dev
```

On macOS/Linux, replace `Copy-Item` with `cp`.

## Build and Test

```bash
cd web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

`NODE_ENV=production` is treated as a real production build unless `NEXT_PUBLIC_APP_ENV` is explicitly `development`, `test`, or `local`. Keep that override for localhost Docker/E2E builds; remove it for Vercel or production Docker images so missing/insecure public URLs fail closed.

Install Playwright browsers once:

```bash
pnpm test:e2e:install
```

Focused app checks:

```bash
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build

pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
```

## Web Contract

- Success envelope: `{ success: true, data, meta? }`
- Errors: RFC 7807 Problem Details with stable `code`
- Pagination: collection in `data`, page context in `meta`
- Locale routes: `/:locale/...` for `vi`, `en`, `ja`
- Non-locale routes should redirect rather than duplicate page logic

## Operational Notes

- Do not add runtime mock data, fake chart values, or fabricated connection states.
- Query UIs need loading, empty, retryable error, and permission-denied states.
- Admin order feed should use WebSocket `/events`; polling is only a controlled fallback.
- Keep generated API client changes in `web/packages/api-client`, not a root package.
