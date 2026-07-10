# FoodFlow デプロイガイド

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## デプロイ原則

Integration branch が clean で、push/review/verification が完了し、すべての gate が green になってから deploy します。dirty root worktree、漏えい済み key、赤い Batch 4 gate がある状態では deploy しません。

2026-07-10 の local verify: 空の database への migration 22/22、backend 121 suites / 891 tests、web/mobile green、Playwright Chromium/Firefox 72/72、axe 4/4 (serious/critical = 0)、visual と tenant isolation が pass しました。Production は Vercel の API secrets と両 web project の `NEXT_PUBLIC_SUPABASE_ANON_KEY`、Supabase CLI の `SUPABASE_ACCESS_TOKEN` が不足しているため未 deploy です。Chat に貼り付けた key は secret manager に再登録する前に rotate してください。

2026-07-07 時点の Batch 4 状態: remote cleanup は `118459e539eecb2dbd61e033431b7f4b5104f0e0` で recheck 済みで、`git ls-remote --heads origin` は `refs/heads/master` のみを返します。validated code line では backend、web、Docker、Playwright Chromium/Firefox、mobile、OpenAPI、compose、high-confidence secret scan の local gates は pass 済みです。詳細は [Batch 4 release report](batch4-release-report.md) を参照してください。これは local verification evidence であり、production deployment approval ではありません。Vercel project `food-delivery-app` は link 済みで Admin app 用の root/build settings も修正済みですが、production env は空です。Supabase と Vercel の deploy は、GitHub Actions access が復旧し、current-head remote checks が green になり、production secrets が rotate 済みで有効になり、Supabase CLI/auth が利用可能になり、有効な backend/API URL と Vercel env が揃うまで blocked です。

## Batch 4 update 2026-07-09

Local head `f5ba366` is 71 commits ahead of `origin/master`. Supabase realtime/storage/queue foundation has landed. Backend full Jest passed 116 suites / 849 tests after the Supabase queue drain work. Vercel projects now exist for API/Admin/Restaurant: `foodflow-api`, `food-delivery-app`, and `foodflow-restaurant`. Generated app-owned `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CRON_SECRET` were stored as sensitive env vars on `foodflow-api` without printing values.

Production deploy is still blocked because real Supabase database/service-role/JWT/anon keys, Redis, Google Maps, DeepSeek, SePay, SMTP, FCM, and Twilio values are not configured yet. Supabase MCP OAuth is logged in, but Supabase CLI still needs `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, and `DIRECT_URL` before migrations can run.

Vercel Hobby cron can run only once per day on the current account, so the committed `/api/jobs/drain` cron is daily. Use Vercel Pro minute cron or another approved scheduler before relying on `QUEUE_PROVIDER=supabase-postgres` for time-sensitive dispatch/order-timeout jobs.

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
| Maps | backend `GOOGLE_MAPS_API_KEY` and owned `OSRM_URL`; Admin/Restaurant browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLI | Vercel token, Supabase access token |

チャット、ログ、スクリーンショット、チケット、git history に出た key は production 前に rotate してください。

Secret ではないが production で必須の config: `DELIVERY_BASE_FEE_VND` に承認済みのチェックアウト base delivery fee を設定します。Backend boot validation は pricing config 不足を拒否し、MVP hardcoded fee で order を作成しません。

最新の deploy-readiness check: Vercel CLI auth は有効で、`food-delivery-app` は Admin 用に link/config 済みですが、production env は `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` が未設定です。Supabase MCP は project ref `lvanszgszzfopusboich` で追加/OAuth login 済みですが、Supabase CLI deploy には release shell の `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, `DIRECT_URL` が必要です。Production deploy は実行していません。

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

Supabase production preflight helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-env-prompt.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-env-prompt.ps1 -RunPreflight
```

This helper sets values only in the current process, clears them after preflight, never writes `.env`, never prints secrets, and never runs migrations.

## Vercel

Admin と Restaurant の build が通った後に web を deploy します。

| Vercel project | Root directory | Build command |
|---|---|---|
| `foodflow-api` | `backend` | `pnpm prisma generate && pnpm build` |
| `food-delivery-app` | `web/apps/admin` | `cd ../.. && pnpm --filter foodflow-admin build` |
| `foodflow-restaurant` | `web/apps/restaurant` | `cd ../.. && pnpm --filter restaurant build` |

Public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESTAURANT_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Deploy 前に preflight を実行し、project settings と production env 名を確認します。secret values は出力しません。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1
```

env が不足している場合は、secret を chat/docs/shell history に貼らず、preflight が報告した不足名だけを local prompt helper に渡します。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -LinkProjects
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -PromptValues
```

`-PromptValues` を使う場合、この helper は deploy せず、`.env` file も書きません。secret は hidden input から stdin 経由で `vercel env add` に渡し、public/non-secret config だけ non-sensitive mode で Vercel に保存します。

Admin と Restaurant は production で API、realtime、canonical app URL、または必須 map key の env が未設定の場合、明示的に失敗します。localhost の既定値は dev 専用です。`FOODFLOW_ENABLE_DEV_API_REWRITE` は local Restaurant dev proxy 専用なので、Vercel では有効化しないでください。

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
- Synthetic flows: login, restaurant order queue and live tracking map, admin exports, AI configured/degraded state, driver map

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
