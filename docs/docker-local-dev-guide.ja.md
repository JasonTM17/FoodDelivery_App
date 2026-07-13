# Docker and Local Development Guide

## Scope

Local development、isolated E2E、container validation、self-hosted compatibility のガイドです。Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）、Railway（API、worker、migrator、Redis）、Vercel（Admin、Restaurant）です。[deployment guide](deployment-guide.ja.md) を参照してください。

必要: Docker Compose v2/Buildx、Node.js 22.13+、Corepack pnpm 11.11.0、Flutter SDK。GIF 再生成時のみ FFmpeg。

## Env and secrets

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

Ignored file のみ作成します。Real dotenv、CLI auth、dump、certificate、token、signing material を commit しません。Chat/log に出た key は rotate。`foodflow_dev`、`minioadmin`、development JWT は production 禁止です。

Local provider は Socket.IO + Redis/BullMQ + MinIO、managed production は Supabase Realtime/Storage/Postgres queue、Railway API/worker/migrator/Redis、Vercel dashboards を明示します。

## Infrastructure containers + host apps

```powershell
docker compose up -d postgres redis minio

cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm prisma migrate dev
corepack pnpm db:seed
corepack pnpm start:dev
```

Web: `cd web; corepack pnpm install --frozen-lockfile; corepack pnpm dev`。

Mobile: `flutter pub get --enforce-lockfile` 後、`lib/main_customer.dart` または `lib/main_driver.dart`。

## Full local stack

```powershell
docker compose up -d --build
docker compose ps
```

API healthy 前に migration container が exit `0` である必要があります。Worker は backend image の `dist/workers/main.js` を実行し、queue/RAG background work を担当します。HTTP port/health endpoint はないため、HTTP health check ではなく worker log を確認します。`NEXT_PUBLIC_*` は build-time なので変更後は web image を rebuild します。

Checkout からの Compose build には local `revision=local` label が付きます。これは runtime evidence にはなりますが immutable release artifact ではありません。release には frozen `sha-<full-commit>` build、scan、push、clean pull が引き続き必要です。

Health: API `localhost:3001/api/healthz`、Admin `localhost:3000/api/healthz`、Restaurant `localhost:3002/api/healthz`。

## Isolated Batch 4 stack

Root stack を変更しない overlay:

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
```

Ports: Admin `13000`、API `13001`、Restaurant `13002`、Worker は host port なし、Postgres `15432`、Redis `16379`、MinIO `19000/19001`。

CORS origin は `localhost` です。`127.0.0.1` は意図的 error-state test になります。Host から test seed:

```powershell
$env:DATABASE_URL='postgresql://foodflow:foodflow_dev@localhost:15432/foodflow'
$env:DIRECT_URL=$env:DATABASE_URL
cd backend
corepack pnpm db:seed
corepack pnpm db:big-seed
cd ..
Remove-Item Env:DATABASE_URL,Env:DIRECT_URL
```

Deterministic seed は test fixture であり production では block されます。Runtime fallback data ではありません。

起動済み overlay を再 seed した後は、RAG log が post-seed になるよう worker を restart してから直接確認します:

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml restart worker
docker compose -f docker-compose.yml -f docker-compose.e2e.yml logs --tail 100 worker
```

`FoodFlow Worker started` と成功した `RAG sync complete` が必要です。Worker には HTTP endpoint がないため HTTP health check は使用しません。

## Backend hot reload

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

Source mount mode は release evidence ではありません。

## Docker artifacts

| Artifact | Dockerfile/target |
|---|---|
| Backend | `backend/Dockerfile` → `runner` |
| Migrate | `backend/Dockerfile` → `migrator` |
| Admin | `web/apps/admin/Dockerfile` |
| Restaurant | `web/apps/restaurant/Dockerfile` |

Generic `web/Dockerfile` はなく、worker は backend image の `dist/workers/main.js` を使用します。Final image は distroless/non-root、`linux/amd64` と `linux/arm64`。Workflow は両 architecture の native dependency、Prisma、Sharp、UID、manifest/SBOM、Trivy を検証します。

## Local release gate

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Development partial run:

```powershell
powershell -File infra/scripts/local-release-gate.ps1 \
  -AllowDirty -SkipInstall -SkipBuild -SkipDeployPreflight
```

Partial evidence は release approval になりません。

## Screenshots/GIFs

Isolated stack が healthy/seeded のとき:

```powershell
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
Remove-Item Env:FOODFLOW_ADMIN_URL,Env:FOODFLOW_RESTAURANT_URL,Env:FOODFLOW_API_URL
```

Real API を使い palette-optimized GIF を作成し intermediate frames を削除します。Exit 0 でも error state を撮影する可能性があるため全画像を目視します。

## Data/self-hosted

- `docker compose down` は volume 保持、`down -v` は local data を削除。対象 compose project を確認してから実行。
- Shared workstation で全 container/volume cleanup をしない。
- Self-hosted は `IMAGE_TAG=v4.0.0` または `sha-<full-commit>` を pin し、real `.env.production` と base + production overlay を使います。`up` 前に `pull --ignore-buildable`、次に `build postgres` を実行します。PostGIS + pgvector の `postgres` は build-only local infrastructure であり、published release image ではありません。
- Socket.IO/Redis/MinIO profile は Supabase/Railway/Vercel misconfiguration の fallback ではありません。

## Troubleshooting

- API/CORS: baked `NEXT_PUBLIC_API_URL` と `localhost`/`127.0.0.1` origin を確認。
- Migration: `migrate` logs を確認し dependency を bypass しない。
- Sharp/native: Alpine/musl build と Debian/glibc runtime を混在させない。
- Redis: BullMQ は `maxmemory-policy noeviction`。
- Maps: restricted key と real telemetry を使い hardcoded coordinate を追加しない。
- AI: rotated key を secret manager に入れ fake LLM fallback を追加しない。
- CI unavailable: local evidence は継続できるが、CI 復旧まで deploy/merge/publish しない。
