# FoodFlow Deployment Guide

## Purpose

Managed production topology:

- Supabase: PostgreSQL/PostGIS、Realtime、Storage。
- Railway: NestJS API、worker、migrator、Redis。Vercel: Admin、Restaurant。
- Docker Hub: production smoke 後の immutable multi-arch artifact。

Secret/CLI auth、current-head test、remote CI、production health が不足している間は deploy しません。Local green は production approval の代わりではありません。

## Invariants

1. Approved clean release worktree のみを使います。
2. Remote branch は `master` 一つ。Historical integration branch を再作成または名前付き push しません。
3. Chat/log/screenshot/ticket/git に出た credential は rotate。
4. Value は secure prompt/dashboard で入力し docs/commit に保存しない。
5. Managed production provider は Supabase を明示し、Socket.IO/MinIO/BullMQ に fallback しない。
6. Database → API → Web の順で deploy。
7. Docker semver/latest は production smoke 後だけ promote。

## Release sequence

Full local gate → current-head GitHub Actions green → rotated secrets/preflight → Supabase → Railway API/worker → Admin/Restaurant → production smoke → `master` verify → Docker immutable。

一つでも fail すれば停止します。

## 1. Source gate

```powershell
git fetch --prune origin
git status --short
git rev-list --left-right --count origin/master...HEAD
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Frozen install、fresh DB migration、backend/web/mobile full suites、Chromium/Firefox、axe serious/critical 0、visual、tenant isolation、realtime auth、shipper route/ETA、AI fail-closed/live、secret scan、multi-arch image scan が必要です。その後 remote workflows も green にします。

## 2. Secure credentials

Supabase release shell:

```powershell
powershell -File infra/scripts/supabase-env-prompt.ps1 -RunPreflight
```

Process-scoped prompt で `SUPABASE_ACCESS_TOKEN`、`SUPABASE_PROJECT_REF`、pooled `DATABASE_URL`、direct/session `DIRECT_URL` を読み、preflight 後に消去します。

Railway API/worker/migrator/Redis:

```powershell
powershell -File infra/scripts/vercel-web-preflight.ps1
powershell -File infra/scripts/railway-preflight.ps1
```

Preflight が報告した name だけ追加し、再実行します。

## 3. Production env

API core:

- `NODE_ENV=production`
- Supabase pooled `DATABASE_URL`、direct `DIRECT_URL`
- 現在残る cache/history 用の managed `REDIS_URL`（localhost 禁止）
- `REALTIME_PROVIDER=supabase`
- `STORAGE_PROVIDER=supabase`
- `QUEUE_PROVIDER=supabase-postgres`
- `SUPABASE_URL`、server-only `SUPABASE_SECRET_KEY`、Realtime API と短期 ES256 service JWT 用の `SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_REALTIME_JWT_PRIVATE_KEY`、`SUPABASE_REALTIME_JWT_KEY_ID`、`SUPABASE_STORAGE_BUCKET=foodflow-public`
- private `SUPABASE_KYC_BUCKET=foodflow-private`、`DRIVER_KYC_MAX_UPLOAD_MB=4`、`DRIVER_KYC_RETRY_LIMIT=3`
- strong `CRON_SECRET`、access/refresh JWT secrets
- verified CORS/reset URL
- Maps/routing、DeepSeek、SePay、SMTP、FCM、Twilio、webhook secrets。

FCM は legacy server key ではなく Firebase Admin SDK/HTTP v1 を使います。Production では `FCM_PROJECT_ID` と ADC/workload identity または secret-managed one-line `FCM_SERVICE_ACCOUNT_JSON` が必要です。Self-hosted Compose は API/worker 両方に JSON secret が必要です。Deploy 後に controlled-token notification を送信します。config/unit test は live Firebase delivery を証明しません。

Admin は verified `NEXT_PUBLIC_API_URL`（末尾 `/api`）、Admin origin、Maps key、Supabase URL/anon key、`NEXT_PUBLIC_REALTIME_PROVIDER=supabase`。Restaurant は Restaurant origin を使用します。Public key でも origin/API/RLS restriction が必要です。

## 4. Supabase

全 gate 後:

```powershell
cd backend
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm run db:migrate:prod
cd ..
```

Production で `migrate dev`、reset、demo seed は実行しません。

Final source head のすべての migration、`realtime_outbox`/`job_outbox`/`ai_usage_events` の RLS、明示的 realtime publication、JWT channel claim policy、anon denial、Storage bucket policy を確認します。KYC bucket は private、driver write は owner-scoped signed grant、Admin read は 5 分で失効し、browser response に raw object key を返しません。Authorized event は届き、cross-tenant/expired token は拒否される必要があります。

## 5. Railway API, worker, migrator, Redis

Railway に `foodflow-api`（root `backend` と `backend/railway.toml`）、`foodflow-worker`（同じ SHA backend image、`dist/workers/main.js`）、`foodflow-migrate`（同じ SHA migrate image）、managed Redis を作成します。migrator は API より前に一度実行し、Vercel は Admin/Restaurant のみを deploy します。

```powershell
railway login
railway link
powershell -File infra/scripts/railway-preflight.ps1
```

Railway の `/api/healthz`、`/api/readyz`、Redis/Supabase Storage readiness、secret-free worker logs を確認します。API が green でなければ Web を deploy しません。

Verified API alias を Web env に設定して preview/test 後に promote:

```powershell
vercel --cwd web/apps/admin
vercel --cwd web/apps/restaurant
vercel --prod --cwd web/apps/admin
vercel --prod --cwd web/apps/restaurant
```

`/vi|en|ja/login`、`html lang`、title、console/network、health、404 shell/localhost/legacy socket がないことを確認します。

## 6. Production smoke

```powershell
$env:API_URL='https://<api>'
$env:ADMIN_URL='https://<admin>'
$env:RESTAURANT_URL='https://<restaurant>'
powershell -File infra/scripts/production-health-check.ps1
```

短時間 smoke token を process env に入れ、次を実行します。

```powershell
powershell -File infra/scripts/post-deploy-smoke.ps1 \
  -RequireAuthenticatedChecks -RequireRoutePolyline -CreateExportJob
```

Health、locale pages、realtime channel、DeepSeek live、export、shipper route/polyline、tenant denial、SePay、notification、Storage が必須です。Bearer は出力されず、実行後に process から消去します。

## 7. Master and Docker

Production smoke + remote CI green 後:

```powershell
git fetch --prune origin
git push origin HEAD:master
git fetch --prune origin
git rev-list --left-right --count origin/master...HEAD # 0 0
git ls-remote --heads origin                         # master only
```

Verified master commit に `v4.0.0` を付けます。Workflow は `sha-<full-commit>` を `amd64/arm64` で build、runtime smoke、Trivy、health 後に immutable semver を作ります。`latest` は manual promotion のみ。Worker は backend image を使います。

## Self-hosted compatibility

Supabase/Railway/Vercel production ではありません。

```powershell
Copy-Item .env.production.example .env.production
$env:IMAGE_TAG='v4.0.0'
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml pull --ignore-buildable
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml build postgres
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

全 example value を置き換え、`latest` ではなく semver/SHA を pin します。PostGIS + pgvector の `postgres` service は build-only local であり published release image ではありません。`up` 前に `pull --ignore-buildable`、次に `build postgres` を実行します。

## Rollback/abort

Vercel は last verified deployment へ rollback。Database は原則 forward migration。RLS を無効化しない。Docker は以前の immutable tag/digest を使用します。

Dirty/diverged source、missing auth/secret、unrotated key、red/missing gate、unproven RLS/tenant、map/realtime/chatbot/export/payment smoke failure、両 architecture 未scan、既存 semver と digest conflict のいずれかがあれば release を中止します。

[Testing](testing-guide.ja.md) · [Security](security-audit-guide.ja.md) · [Release report](batch4-release-report.md)
