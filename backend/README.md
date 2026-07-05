# FoodFlow Backend

## 1. Purpose

NestJS API server for the FoodFlow food delivery platform. Provides REST API, WebSocket realtime tracking, BullMQ job processing, JWT authentication with RBAC (customer, driver, restaurant, admin), and an LLM-first AI chatbot adapter. Called by the Flutter mobile apps and Next.js web dashboards. Calls PostgreSQL+PostGIS for spatial queries, Redis for caching/sessions/job queues, and MinIO for object storage.

## 2. API Surface

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Users | `GET/PATCH /api/users/profile`, `GET /api/users` (admin) |
| Restaurants | `GET /api/restaurants`, `GET /api/restaurants/nearby`, `GET/POST/PATCH /api/restaurants/:id` |
| Restaurant profile | `GET/PATCH /api/restaurant/profile` (opening hours + persisted holiday closures), `POST /api/restaurant/profile/upload` |
| Menu | `GET/POST /api/restaurants/:id/categories`, `GET/POST/PATCH/DELETE /api/restaurants/:id/items`, `GET /api/items` |
| Orders | `POST /api/orders`, `GET /api/orders`, `GET/PATCH /api/orders/:id`, `GET /api/orders/:id/timeline` |
| Drivers | `GET /api/drivers/nearby`, `PATCH /api/drivers/location`, `GET /api/drivers/earnings` |
| Dispatch | `POST /api/dispatch/assign`, `POST /api/dispatch/accept/:orderId`, `POST /api/dispatch/broadcast` |
| Tracking | WebSocket `tracking:subscribe`, `tracking:location-update`, `tracking:unsubscribe` |
| Admin | `GET /api/admin/kpi`, `GET /api/admin/audit-log`, `GET /api/admin/support`, `PATCH /api/admin/support/:id` |
| Health | `GET /api/health`, `GET /api/readyz`, `GET /api/metrics` |

Full reference: [Swagger UI](http://localhost:3001/api/docs) when running, or see `docs/api-reference.md`.

## 3. Env Vars

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `DIRECT_URL` | Yes | — | Direct/session PostgreSQL connection for Prisma migrations; use the Supabase direct/session URL in production |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | HMAC-SHA256 signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token signing key |
| `PASSWORD_RESET_URL_BASE` | No | `http://localhost:3000/reset-password` | Admin/web reset URL used when composing password reset email links |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | No | `60` | One-time password reset token lifetime |
| `MINIO_ENDPOINT` | Yes | `localhost` | MinIO host |
| `MINIO_PORT` | Yes | `9000` | MinIO API port |
| `MINIO_ACCESS_KEY` | Yes | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | Yes | `foodflow` | Bucket name |
| `MINIO_PUBLIC_URL` | Yes | `http://localhost:9000` | Public-facing MinIO URL |
| `GOOGLE_MAPS_API_KEY` | No | — | Google Maps Geocoding API key |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | No | — / `587` / `false` | SMTP worker transport for email delivery; password reset requests enqueue here when configured |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No | — / — / `noreply@foodflow.vn` | SMTP credentials and sender address; keep credentials in secret manager / ignored `.env` |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek API key for direct chatbot replies. Keep in secret manager / ignored `.env`, never commit |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | DeepSeek OpenAI-compatible base URL |
| `DEEPSEEK_MODEL` | No | `deepseek-v4-flash` | DeepSeek model for chatbot replies |
| `DEEPSEEK_THINKING` | No | `disabled` | Set `enabled` only if the chat flow can handle slower reasoning responses |
| `DEEPSEEK_DAILY_BUDGET_USD` | No | — | Optional AI monitor budget display |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `CORS_ORIGINS` | No | `http://localhost:3000,...` | Comma-separated allowed origins |

Copy `.env.example` to `.env` and fill in the required values.

## 4. Run Locally

```bash
# Prerequisites: Docker Desktop, Node.js 20+, pnpm 11+

# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install
pnpm prisma generate

# 3. Run migrations and seed
pnpm prisma migrate dev --name init
pnpm db:seed        # Small sample data
# pnpm db:big-seed  # Large dataset

# 4. Start dev server (hot reload)
pnpm start:dev       # http://localhost:3001/api

# 5. Swagger docs
# Open http://localhost:3001/api/docs
```

## 5. Test

```bash
# Unit tests
pnpm test

# Unit tests with coverage (threshold: lines >= 80%, branches >= 75%)
pnpm test:cov

# E2E tests
pnpm test:e2e

# Type check
pnpm typecheck

# Lint
pnpm lint
```

Test framework: Jest + Supertest (e2e). Mock Redis via `ioredis-mock` in unit tests.

## 6. Runbook

### Rotate JWT Secrets

```bash
# 1. Generate new secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update .env and docker-compose.yml
# 3. Phase 1: set JWT_SECRET_OLD = old value, JWT_SECRET = new value
# 4. Deploy — server verifies both for token TTL window (15 min)
# 5. After 15 min: remove JWT_SECRET_OLD, deploy again
```

### Reset Database

```bash
docker compose down -v    # Destroys volumes
docker compose up -d      # Recreates fresh DB
cd backend
pnpm prisma migrate dev --name init
pnpm db:seed
```

### Drain and Restart Workers

```bash
# Graceful shutdown (finish active jobs, stop picking new ones)
docker compose stop worker
# Wait for active jobs to complete (check Bull Board: http://localhost:3004)
docker compose start worker
```

### View Logs

```bash
docker compose logs -f backend
docker compose logs -f worker
```

### Database Migrations (Production)

```bash
# Never use prisma migrate dev in production
pnpm prisma migrate deploy
```

### Health Check

```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"2026-06-04T...","uptime":12345}
```

### Queue Monitoring

Open Bull Board at `http://localhost:3004` to inspect dispatch, notification, and cleanup queues. Use to drain stuck jobs, view failed jobs, or retry.
