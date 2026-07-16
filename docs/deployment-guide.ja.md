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
- Broadcast request を有界にする `SUPABASE_REALTIME_PUBLISH_TIMEOUT_MS=5000`
- `STORAGE_PROVIDER=supabase`
- `QUEUE_PROVIDER=supabase-postgres`
- API は `FOODFLOW_PROCESS_ROLE=api`、worker は `FOODFLOW_PROCESS_ROLE=worker`。Production で role が未設定または不正なら startup は fail closed
- `SUPABASE_URL`、opaque server-only `SUPABASE_SECRET_KEY`、Storage 専用 legacy JWT `SUPABASE_SERVICE_ROLE_KEY`、Realtime API と短期 ES256 service JWT 用の `SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_REALTIME_JWT_PRIVATE_KEY`、`SUPABASE_REALTIME_JWT_KEY_ID`、`SUPABASE_STORAGE_BUCKET=foodflow-public`
- private `SUPABASE_KYC_BUCKET=foodflow-private`、`DRIVER_KYC_MAX_UPLOAD_MB=4`、`DRIVER_KYC_RETRY_LIMIT=3`
- strong `CRON_SECRET`、access/refresh JWT secrets
- verified CORS/reset URL
- Maps/routing、DeepSeek、SePay、SMTP、FCM、Twilio、webhook secrets。

FCM は legacy server key ではなく Firebase Admin SDK/HTTP v1 を使います。Production では `FCM_PROJECT_ID` と ADC/workload identity または secret-managed one-line `FCM_SERVICE_ACCOUNT_JSON` が必要です。Self-hosted Compose は API/worker 両方に JSON secret が必要です。Deploy 後に controlled-token notification を送信します。config/unit test は live Firebase delivery を証明しません。

Admin は verified `NEXT_PUBLIC_API_URL`（末尾 `/api`）、Admin origin、Maps key、Supabase URL/anon key、`NEXT_PUBLIC_REALTIME_PROVIDER=supabase`。Restaurant は Restaurant origin を使用します。Public key でも origin/API/RLS restriction が必要です。

### Vercel Preview の環境境界

2 つの Vercel project は、`Preview`（branch 固定の場合は release branch）に `NEXT_PUBLIC_APP_ENV`、`NEXT_PUBLIC_API_URL`、各 role URL、`NEXT_PUBLIC_REALTIME_PROVIDER`、`NEXT_PUBLIC_WS_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_MAP_PROVIDER`、`NEXT_PUBLIC_MAP_STYLE_URL` を設定します。role URL がないと Next.js は host を推測せず metadata 収集中に fail します。`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` は Vercel の sensitive secret store にだけ置き、GitHub variables、docs、browser screenshot にはコピーしません。値を変更したら Preview を redeploy し、新しい deployment が Ready になってから GitHub の Vercel check を確認します。

## 4. Supabase

全 gate 後:

```powershell
cd backend
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm run db:migrate:prod
cd ..
```

本番変更の前に、Railway の project と environment を明示した read-only
migration audit を実行します。migrator と同じ local Prisma schema を使う
ため `backend` から実行してください。`railway run` は sealed variable を
local command に注入するだけで、値は表示しません。

```powershell
$env:RAILWAY_PROJECT_ID='<project-id>'
Push-Location backend
railway run --project $env:RAILWAY_PROJECT_ID --service foodflow-migrate --environment production --no-local -- `
  corepack pnpm run db:audit:prod
railway run --project $env:RAILWAY_PROJECT_ID --service foodflow-migrate --environment production --no-local -- `
  corepack pnpm exec prisma migrate status --schema prisma/schema.prisma
Pop-Location
```

承認済み release は pending と remote-only migration がない状態でなければ
なりません。未 deploy の candidate migration、または local SQL がない
historical rolled-back row は provenance review が終わるまで blocker です。
production migrator は、適用済み migration の内容が local SQL と LF/CRLF
表現を超えて異なり、かつ exact checksum が明示的に review 済みの immutable-image
provenance entry にない場合、Storage API と `prisma migrate deploy` の前に
fail-closed します。checksum drift を隠すために `prisma migrate
resolve` を使わず、source と backup の履歴を先に reconcile してください。
`_prisma_migrations` table がない場合も Supabase Storage recovery を停止し、
誤った、または未初期化の database target に provider mutation を許可しません。
本当に空の database は target identity preflight 後、Storage recovery を使わず
`db:migrate:prod` で別途 bootstrap してください。

Current provenance review では immutable migrator image
`docker.io/nguyenson1710/foodflow-migrate@sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756`
の revision `1f761a65b4a7053858a512bf6eb09a3fd2adbef0` から 2 件の production
record を byte-for-byte で復元しました。Realtime checksum
`3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7`
は current source と line ending のみ異なり、Job checksum
`72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf`
は line ending と非実行 worker-host comment のみ異なります。Guard はこの
exact migration-name/checksum entry を、review 済み local checksum が変わらない
場合だけ認めます。`20260712143000_add_production_storage_bucket` の Storage checksum
`4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`
（`2026-07-12T01:08Z` applied）は Git object と調査済み registry image の
どちらにも見つかりませんでした。Read-only production audit はこの sole
provenance blocker だけを示して exit `1` します。Schema end-state は provenance
ではなく、candidate migration 42 は undeployed のままです。

Production で `migrate dev`、reset、demo seed は実行しません。

Final source head のすべての migration、`realtime_outbox`/`job_outbox`/`ai_usage_events` の RLS、明示的 realtime publication、JWT channel claim policy、anon denial、Storage bucket policy を確認します。KYC bucket は private、driver write は owner-scoped signed grant、Admin read は 5 分で失効し、browser response に raw object key を返しません。Authorized event は届き、cross-tenant/expired token は拒否される必要があります。

## 5. Railway API, worker, migrator, Redis

Railway に `foodflow-api`（root `backend` と `backend/railway.toml`）、`foodflow-worker`（同じ SHA backend image、`dist/workers/main.js`）、`foodflow-migrate`（同じ SHA migrate image）、managed Redis を作成します。Supabase の backup 後、API より前に migrator を一度実行し、Vercel は Admin/Restaurant のみを deploy します。migrator image は `dist/migrations/production-migrate.js` を実行し、local SQL または exact immutable-image provenance entry に対して最初に適用済み migration の checksum を検証します。その後、JWT の `SUPABASE_SERVICE_ROLE_KEY` で Storage API を呼び出し、legacy bucket を削除し、cleanup が成功した場合だけ空 bucket migration の失敗レコードを resolve してから `prisma migrate deploy` を実行します。内容 checksum の不一致または bucket inventory/delete エラーは schema rollout 前に fail-closed です。未解決の production Storage checksum を隠すために `prisma migrate resolve` を使わず、original SQL bytes の復元と review まで audit を blocker のままにします。

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

### Production が空の場合の authenticated role smoke

FoodFlow user は Supabase Auth ではなく独自 JWT/Prisma user です。`backend/scripts/production-role-smoke-fixture.ts` は、4 個の一時 `@example.invalid` identity と ownership marker 付き inactive/closed restaurant 1 個だけを作成します。Exact confirmation、unique run ID、printable ASCII temporary password、absolute cleanup-signal path、provision 前に開始する 60–900 秒 cleanup-trigger deadline が必須です。`READY` は残り秒数を表示し、cleanup と capability drain の時間は別です。`RAILWAY_ENVIRONMENT_NAME=production`、同一 Supabase project ref、database `postgres`、schema `public`、direct/session port `5432`（transaction-pool `6543` は禁止）、serializable preflight の `0` user/restaurant/order/GPS を検証します。URL/row/credential/token は出力せず、Prisma は `connection_limit=1`、advisory lease、PostgreSQL backend PID heartbeat を使用します。

Provision は run ID と immutable UUID だけを含む non-secret lifecycle row を fixture と同じ transaction で保存します。`READY` 後、Google Chrome で Admin/Restaurant を認証し、Customer/Driver は profile、orders/earnings、private Realtime、cross-role denial の read-only API のみを確認します。Order、payment、export、AI session、FCM、upload、GPS は作成しません。Realtime signer は active user の shared lock を保持します。Controller は同じ serializable transaction 内で lifecycle と ownership/topology を lock 後に再検証し、lease PID と semantic FK を確認し、immutable UUID だけで削除して lifecycle を `deletion_committed` にします。通常 run は `CLEANUP_OK ... outcome=deleted` が必須です。その後 protected route の login redirect を確認し、Chrome と全 Realtime client を閉じます。同じ lease/PID を 5 分 TTL + 5 秒まで保持した後に `CAPABILITY_DRAIN_OK realtimeTokensExpired=true` を出力し、residue を再検査して lifecycle を `complete` にし、最後に `FINAL_RESIDUE_OK users=0 profiles=0 restaurants=0 relations=0` を出力します。その後、独立した `0` user/profile/restaurant/order/GPS を確認します。

Owner process が cleanup 前または capability drain 中に強制終了された場合、同じ run ID を再 provision しません。Exact confirmation、元の run ID、`FOODFLOW_PRODUCTION_SMOKE_MODE=cleanup` で recovery を実行します。古い password と signal path は不要です。`RECOVERY_CLEANUP`、`CLEANUP_OK`、`CAPABILITY_DRAIN_OK`、`FINAL_RESIDUE_OK` の順と、独立した zero inventory 再確認が必須です。Row が残る場合は `outcome=deleted`、元の immutable UUID と一致する durable lifecycle tombstone がある場合だけ `outcome=already-deleted` です。Durable record のない run ID は成功扱いせず、Owner が生存中なら advisory lease が拒否します。Mutation 開始後の provision failure は `RECOVERY_REQUIRED` を出し、有効な lease 下で完了した場合だけ `RECOVERY_RECONCILED`、未完了なら `RECOVERY_FAILED` を出します。

Fixture 実行中に別 Prisma client を開かないでください。Supabase session pool が 15 client に達すると `EMAXCONNSESSION` になります。この smoke は zero-state auth/RBAC の証拠であり、active order/provider/device の full smoke ではありません。

## 7. Master and Docker

Production smoke + remote CI green 後:

```powershell
git fetch --prune origin
git push origin HEAD:master
git fetch --prune origin
git rev-list --left-right --count origin/master...HEAD # 0 0
git ls-remote --heads origin                         # master only
```

Release は次の順序で実行し、2 回の Docker Publish をまとめてはいけません。

1. **Docker Publish** を `publish_release=false`、空の `release_tag`、`promote_latest=false` で手動 dispatch します。両 architecture の runtime smoke/scan 後に `sha-<full-commit>` manifest のみを publish します。
2. Migration checksum と backup gate が通った後、その SHA を正確に deploy します。one-off migrator を実行し、Railway API/worker を同じ backend digest に pin し、両 Vercel project を同じ commit から deploy します。health、readiness、log、revision 一致、authenticated role/provider smoke を確認します。
3. 変更されていない `origin/master` から **Docker Publish** を再度 dispatch し、`publish_release=true` と未使用の stable `release_tag` を指定します。Semver promotion 前に API、Admin、Restaurant が workflow SHA を返す必要があります。`promote_latest` は別の明示的な選択です。
4. 検証済み SHA に Git semver tag を作成して push し、その tag と完全な `source_sha` で **Release** を手動 dispatch します。GitHub Release と SBOM 添付の作成前に、Git tag と Docker Hub/GHCR の SHA/semver digest が検証されます。

Tag push だけでは publish も GitHub Release も開始しません。Step 3–4 を許可する前に GitHub `production` Environment の必須 reviewer/protection を設定します。Worker は backend image を使用し、別 artifact は publish しません。

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
