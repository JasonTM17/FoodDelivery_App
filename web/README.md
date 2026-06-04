# FoodFlow Web

## 1. Purpose

Next.js Turborepo containing two dashboard applications for the FoodFlow platform. The **admin dashboard** provides KPI charts, realtime driver map, user/restaurant/promotion management, support kanban, and audit logs. The **restaurant dashboard** provides live order queue, menu CRUD, and revenue analytics. Both apps consume the NestJS backend API and share a common shadcn/ui component library.

## 2. API Surface

These dashboards are frontend-only consumers. They call the backend REST API and connect to the WebSocket gateway:

| Dashboard | Port | URL | Primary Users |
|-----------|------|-----|---------------|
| Admin | 3002 | `http://localhost:3002` | Platform administrators |
| Restaurant | 3003 | `http://localhost:3003` | Restaurant owners/staff |

### External API Dependencies

- **Backend API**: `http://localhost:3001/api` — all data operations
- **WebSocket**: `ws://localhost:3001` — realtime order updates, driver tracking
- **Google Maps**: embedded map component in admin dashboard

## 3. Env Vars

Each app has its own `.env.local`:

### Admin (`web/apps/admin/.env.local`)

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | `ws://localhost:3001` | WebSocket gateway URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | — | Google Maps API key |

### Restaurant (`web/apps/restaurant/.env.local`)

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | `ws://localhost:3001` | WebSocket gateway URL |

## 4. Run Locally

```bash
# Prerequisites: Node.js 20+, pnpm 10+, backend running on :3001

# 1. Install dependencies
pnpm install

# 2. Create env files
cp apps/admin/.env.example apps/admin/.env.local    # if template exists
cp apps/restaurant/.env.example apps/restaurant/.env.local

# 3. Start both dashboards (Turborepo parallel dev)
pnpm dev
# Admin:      http://localhost:3002
# Restaurant: http://localhost:3003

# 4. Build for production
pnpm build

# 5. Start production server
pnpm start
```

## 5. Test

```bash
# Type check across the monorepo
pnpm typecheck

# Lint
pnpm lint

# Unit tests (when configured per app)
cd apps/admin && npx next test
cd apps/restaurant && npx next test

# Build (catches type errors, dead code, bundle issues)
pnpm build
```

Coverage thresholds: lines >= 80%, branches >= 70%.

## 6. Runbook

### Adding a New shadcn/ui Component

```bash
cd web
pnpm ui:add button          # Adds to packages/ui
```

Components are imported as `import { Button } from '@foodflow/ui'` in both apps.

### Debugging API Connection Issues

1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS origins in backend `.env` include `http://localhost:3002` and `http://localhost:3003`

### Clearing Next.js Cache

```bash
rm -rf apps/admin/.next apps/restaurant/.next
pnpm dev
```

### Adding a New Dashboard App

1. `mkdir -p apps/<name>/app`
2. Create `package.json` with Next.js scripts
3. Add `apps/<name>` to `turbo.json` pipeline
4. Create `error.tsx`, `loading.tsx`, and `page.tsx`

### Per-Segment Error/Loading Boundaries

Every route segment must have sibling `error.tsx` and `loading.tsx`. Audit:

```bash
for d in apps/*/app/*/; do
  test -f "${d}error.tsx" || echo "MISSING error.tsx: $d"
  test -f "${d}loading.tsx" || echo "MISSING loading.tsx: $d"
done
```
