# FoodFlow Testing Guide

## Release rule

Final source head が full local gates、fresh remote CI、provider preflight、production smoke をすべて pass した場合のみ green です。Focused test や historical count、skip 付き script は release approval ではありません。

## Current evidence

2026-07-13 の scoped hardening evidence:

| Area | Result |
|---|---|
| Backend | 138 suites / 1016 tests、Prisma validate/generate、typecheck、lint、build が pass。 |
| Database | Repository は ordered 34 migrations を track しています。fresh isolated PostgreSQL/PostGIS+pgvector database は 34 migrations 全てを apply し、FCM-revocation table/index を確認しました。Supabase production は直前の 33 migrations で最後に checksum 検証され、migration 34 は authorized rollout が必要です。historical Docker test volume の applied migration-history 34 行と rolled-back 1 行は現在の FCM migration より前のもので、current-source または fresh migration count の evidence ではありません。 |
| Mobile Flutter | FCM foreground/tap、logout cleanup、起動中 Driver inbox の変更後に Flutter analyze と fresh full 341 tests が pass。focused FCM lifecycle/presentation は 14 tests が pass。 |
| Web | Admin 195 tests、Restaurant 134 tests、両 app の typecheck/lint と production builds が verified Vercel production env で pass。 |
| Browser E2E | Clean-volume current-source isolated Docker matrix は Chromium、Firefox、Pixel 5 で各 68/68 を pass（204/204、6.8 分、retry/failure なし）。これは local evidence のみで、remote CI または production approval ではありません。 |
| FCM | Local contract は 4 backend notification suites / 40 tests と Flutter lifecycle/presentation 14 tests が pass。live send は未実行: production credential と controlled device token が必要。 |

### Current-source Docker E2E / RAG evidence — 2026-07-13

Repository は 34 migrations を track しています。Clean-volume isolated run は当時 track されていた 33 migrations completed、pending なしを報告しました。その後 fresh isolated PostgreSQL/PostGIS+pgvector database が current 34 migrations を全て apply し、`fcm_token_revocations` と `fcm_token_revocations_expires_at_idx` を確認しました。Disposable seed は restaurants 50、drivers 50、customers 100、historical orders 500 を作成しました。再利用した historical Docker test volume の `_prisma_migrations` には、削除済み zero-step migration の履歴により applied 34 行と rolled-back 1 行があります。この volume は current source の fresh migration count の evidence ではありません。Supabase production は最後に 33 migrations で checksum 検証され、authorized Railway migrator rollout は release gate のままです。Overlay は backend image の専用 worker を起動し、API process と background work を共有しません。Seed 後に worker を起動し、`FoodFlow Worker started` と `indexed: 402`, `unchanged: 0`, `failed: 0`, `deactivated: 0` の RAG sync 完了を記録しました。

Current-source worker は fresh seed 後に RAG documents 402 件を index しました。DeepSeek key 未設定のため embedding は pending のままで、fake vector は使っていません。再利用 volume の旧 local run の source ID が null の FAQ 44 件と policy 8 件は historical rows であり、current-worker evidence から除外します。いずれも production data または production embedding/provider approval ではありません。

Rebuilt API/Admin/Restaurant images は全 matrix を pass しました: Chromium 68/68、Firefox 68/68、Pixel 5 68/68（204/204、6.8 分、retry/failure なし）。axe serious/critical、auth/refresh/RBAC、Customer API order、REST で観測した状態収束、tenant isolation、map、contract、visual structure、responsive navigation、Restaurant form-login/reload persistence を含みます。local image は `revision=local` なので、checkout の動作を示すだけで immutable artifact provenance は示しません。Remote CI は同じ Compose overlay と三つの project matrix 用に設定されていますが、fresh authorized remote run が必要です。

これは強い local verification ですが release approval ではありません。fresh remote CI、provider preflight、production smoke、controlled device による live FCM delivery が引き続き必要です。

### Historical 2026-07-13 database runtime evidence

Disposable PostGIS + pgvector container は当時 track されていた 33 migrations、PostGIS/vector、`rag_documents`、source/content indexes、cosine HNSW index を確認しました。`db:big-seed` はこの DB に approved restaurants 50、drivers 50、customers 100、orders 509、reviews 123、promotions 10 を生成し、runtime hard-code ではなく DB-backed generator であることを確認しました。Local worker は live restaurant/menu documents 32 件を同期し、DeepSeek key がない場合は fake vector を作らず全件 pending のままにしました。34 番目の FCM-revocation migration はこの historical evidence run に含まれません。

Supabase production は最後に 33 migrations の matching checksum で検証されました。34 番目の FCM-revocation migration は authorized rollout を待っています。Production users/restaurants/orders/driver profiles/RAG documents はすべて 0 rows で、demo/big seed は実行していません。したがって production に big data が存在するという主張ではありません。

より広い過去の web/browser/container evidence は [release report](batch4-release-report.md) に保持しますが、final source head で再実行するまでは historical です。Full backend/web builds、全 critical pages の axe/visual/Stitch、repaired browser E2E、controlled FCM delivery、production-like tenant/realtime/map/AI smoke、provider preflight、current remote CI は必須です。

## Full local gate

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Development partial run は partial と明記し release approval にしません。

## Backend

```powershell
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm exec jest --runInBand
corepack pnpm build
```

Empty PostGIS に final source head のすべての migration を `migrate deploy`。Auth/RBAC、restaurant tenant、order/payment/webhook replay、promotion/notification/export/audit、realtime token/RLS claims、Supabase Storage/job outbox、GPS/route/ETA/dispatch、DeepSeek/session/telemetry、production env validation を検証します。

## OpenAPI/Web

```powershell
npx -y @stoplight/spectral-cli lint docs/openapi.yaml \
  --ruleset docs/openapi/.spectral.yaml --fail-severity error

cd web
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm --filter foodflow-admin build
corepack pnpm --filter restaurant build
```

Malformed success envelope、fake empty/zero business data、locale、auth refresh、tenant mutation、realtime provider、map geometry、accessibility を test します。

## Isolated E2E

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
$env:ADMIN_URL='http://localhost:13000'
$env:API_URL='http://localhost:13001/api'
$env:RESTAURANT_URL='http://localhost:13002'
cd web
corepack pnpm test:e2e --project=chromium --project=firefox
```

Postgres `15432`、Redis `16379`、MinIO `19000/19001`。`127.0.0.1` は CORS error-state test 専用です。

Auth、Admin、Restaurant queue/status、customer order、realtime/tracking、tenant isolation、Batch 4 contract、visual brand/layout を cover。404 shell、console error、unavailable business data を pass にしません。

## Accessibility/visual/Stitch

- 全 critical page、normal/error state、Chromium/Firefox で axe serious/critical 0。
- Keyboard、focus、heading、labels/errors、live region、contrast、dialog、title/`html lang`/aria locale。
- 現在の `visual-contract.spec.ts` は structural screenshot で full pixel baseline ではありません。
- Dashboard、approval、promotion、audit/export、staff、benchmark、map/tracking、mobile flows を approved Stitch/artifact と desktop/responsive 比較。
- Regression を隠す baseline auto-update は禁止。UI approval 後に docs media を recapture。

## Maps/shipper route

Provider route/cache/failure、Vietnam/service bounds、fresh timestamp、participant/phase、persisted geometry/distance/duration、remaining ETA、tenant denial。Web/mobile は hardcoded camera/polyline/ETA を禁止し stale/wrong-order/wrong-phase event を無視。Production smoke は authorized active order と `-RequireRoutePolyline` を使用します。

## Supabase Realtime

TTL/claims、`private:` channels、role scopes、token issue 前 cross-tenant forbidden、expired/invalid/anon denial、authorized event exactly-once handler。Socket.IO local mode は別 test、production implicit fallback は禁止。

## AI

Key なしは typed fail-closed。Live smoke は rotated `DEEPSEEK_API_KEY` と `deepseek-v4-flash` の server env のみ。Answer/escalation/session ownership/order context/token/latency/cost/budget/provider failure を確認し、canned/random text を LLM evidence にしません。

## Mobile

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build apk --debug --flavor customer -t lib/main_customer.dart \
  --dart-define=REALTIME_PROVIDER=socketio
flutter build apk --debug --flavor driver -t lib/main_driver.dart \
  --dart-define=REALTIME_PROVIDER=socketio
```

Production release では Supabase token/channel、cross-scope denial、reconnect/refresh、receive-only dispatch、Customer/Driver entry、permission/GPS/background/offline/reconnect/route phase、private KYC upload と Admin signed review、vi/en/ja、API/base URL fail-closed、secure map/signing config を追加検証します。

## Docker/security

- `amd64/arm64` build/smoke: bcrypt/BullMQ/MessagePack、Prisma、Sharp、non-root、health、manifest、provenance、SBOM。
- 両 architectures Trivy High/Critical block、actionlint/ShellCheck。
- Semver overwrite refusal と digest compare。
- Secret scan、staged diff、CI Gitleaks/CodeQL/dependency audit/Trivy/SBOM。
- CI unavailable 中は local evidence から publish/deploy しません。

Evidence には SHA、UTC、command、environment、pass/fail、count、image digest/architecture、skip/blocker を記録し、secret/bearer は記録しません。
