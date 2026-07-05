# FoodFlow デプロイガイド

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## デプロイ原則

Integration branch が clean で、push/review/verification が完了し、すべての gate が green になってから deploy します。dirty root worktree、漏えい済み key、赤い Batch 4 gate がある状態では deploy しません。

2026-07-05 時点の Batch 4 状態: `codex/batch4-integration` は `3857433` で `master` に fast-forward 済みで、patch-equivalence 確認後に remote integration branch は削除されました。Verified runtime code includes `d201ce1`, Docker/E2E was rerun after docs head `e24631c`, and mobile driver map overlays were verified at `d201ce1`; docs-only evidence commits 後の正確な current `master` SHA は `git ls-remote --heads origin` で確認します。これは branch cleanup と local-hardening milestone であり、production deployment approval ではありません。Supabase と Vercel の deploy は、GitHub Actions access が復旧し、current-head remote checks が green になり、production secrets/CLI auth が有効になるまで blocked です。

## Local Docker

Host-run development 用の service:

```bash
docker compose up -d postgres redis minio
```

Full container stack:

```bash
docker compose up -d --build
```

Health checks:

```bash
curl http://localhost:3001/api/healthz
curl http://localhost:3000/api/healthz
curl http://localhost:3002/api/healthz
```

## 必須シークレット

| 領域 | 必須 secret |
|---|---|
| Backend auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Database/cache | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, passwords |
| Storage | MinIO/S3 access key and secret key |
| SePay | `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_WEBHOOK_SECRET` |
| AI | `DEEPSEEK_API_KEY` または設定済み LLM provider key |
| Maps | backend `GOOGLE_MAPS_API_KEY`; admin browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLI | Vercel token, Supabase access token |

チャット、ログ、スクリーンショット、チケット、git history に出た key は production 前に rotate してください。

## Supabase

1. Supabase project を作成する。
2. Supabase Postgres pooled transaction-mode URL を backend `DATABASE_URL` に保存する。
3. Supabase Postgres direct/session-mode URL を backend `DIRECT_URL` に保存する。Prisma は `directUrl` 経由で migration に使う。
4. 先に staging DB で migration を検証する。

   ```bash
   cd backend
   pnpm prisma validate
   pnpm prisma migrate deploy
   ```

5. Realtime は必要な table のみに有効化する。production data を公開する前に tenant isolation E2E を通す。
6. Supabase service-role key は server-side secret store のみに保存し、web/mobile に出さない。

Env 例:

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
```

## Vercel

Admin と Restaurant の build が通った後に web を deploy します。

| Vercel project | Root directory | Build command |
|---|---|---|
| FoodFlow Admin | `web` | `pnpm --filter foodflow-admin build` |
| FoodFlow Restaurant | `web` | `pnpm --filter restaurant build` |

Public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_RESTAURANT_URL` |

Admin と Restaurant は production で API、realtime、canonical app URL の env が未設定の場合、明示的に失敗します。localhost の既定値は dev 専用です。`FOODFLOW_ENABLE_DEV_API_REWRITE` は local Restaurant dev proxy 専用なので、Vercel では有効化しないでください。

`NEXT_PUBLIC_GOOGLE_MAPS_KEY` は HTTP referrer で制限してください。

## Backend

Backend boot validation は production infra secret の不足や localhost default を拒否します。API/worker を起動する前に `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, 64文字以上の JWT secrets, `PASSWORD_RESET_URL_BASE`, 正確な `CORS_ORIGINS`, MinIO/S3 values を設定してください。

- Traffic を受ける前に `pnpm prisma migrate deploy` を実行する。
- `NODE_ENV=production` を設定する。
- CORS は production dashboard/mobile origin のみに限定する。
- SePay webhook URL と `SEPAY_WEBHOOK_SECRET` を設定する。
- Socket.IO/realtime と rate limiting 用に Redis を設定する。
- Production では `THROTTLER_MEMORY_FALLBACK=false` を維持し、Redis outage が rate limit を弱めず明示的に失敗するようにする。
- Storage public URL を設定する。
- `/api/healthz` を uptime check 用に公開する。

## Keep-alive と監視

Keep-alive は health を監視するためのもので、runtime failure を隠すためのものではありません。

推奨 checks:

- Backend: `GET /api/healthz`
- Admin: `GET /api/healthz`
- Restaurant: `GET /api/healthz`
- Synthetic flows: login, restaurant order queue, admin exports, AI configured/degraded state, driver map

Migration failure、missing secrets、realtime failure を keep-alive で隠さないでください。

## Pre-deploy gates

- Clean environment で frozen install。
- Backend: Prisma validate/migrate checks, typecheck, lint, Jest, build。
- Web: API client generation/typecheck, Spectral/OpenAPI lint, Admin/Restaurant typecheck/lint/Vitest/build。
- E2E: seed data ありの Playwright Chromium/Firefox。
- Accessibility: axe serious/critical なし。
- Visual: approved Stitch baseline。
- Security: tracked-file secret scan と staged diff secret scan。
- Tenant isolation: restaurant が他 restaurant data を読めない/変更できない。

## Rollback

1. 問題 release への traffic を止める。
2. App container または Vercel deployment を rollback する。
3. Reversible migration と data impact review がない限り destructive DB rollback はしない。
4. Incident review のため log、deployment ID、commit hash を保存する。
