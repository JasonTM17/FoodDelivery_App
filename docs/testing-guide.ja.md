# FoodFlow Testing Guide

## Release rule

Final source head が full local gates、fresh remote CI、provider preflight、production smoke をすべて pass した場合のみ green です。Focused test や historical count、skip 付き script は release approval ではありません。

## Current evidence

2026-07-14 current-head evidence:

| Area | Result |
|---|---|
| Backend | Local release candidate は 142 suites / 1049 tests、Prisma validate/generate、typecheck、lint、build が pass。Push 後の fresh remote CI はまだ必要です。 |
| Database | Current source と Supabase production は ordered 36 migrations で aligned/checksum-verified 済みです。Migration 36 は token と registration capability で FCM revocation を scope し、`token,registration_id` primary key も direct verification 済みです。 |
| Mobile Flutter | Current release candidate は 361 tests と `flutter analyze` を pass。`e4a9155` の Mobile CI も pass し、Customer/Driver debug APK を生成しました。Android/iOS production device evidence は未完了です。 |
| Web | Restaurant mobile Kanban の CLS trace は fix 後およそ 0.0037 です。これは local visual-stability evidence であり、production health claim ではありません。 |
| Browser E2E | fresh current-source clean-volume Docker matrix は 204/204 を 6.6 分で pass しました。Railway/Supabase production GPS の証拠ではありません。 |
| FCM | Local contract は FCM/controller backend 6 suites / 47 tests と focused Flutter notification tests 34 件が pass。live send は未実行で、production credential と controlled device token が必要です。 |

### Fresh clean-volume current-source Docker evidence — 2026-07-14

Rebuilt clean-volume Docker project `foodflow-batch4-e2e` は current source の全 36 migrations を適用し、その後 restaurants 50、drivers 50、customers 100、historical orders 500、canonical orders 9、reviews 123 を seed しました。worker は RAG documents 402 件を index し、full Playwright matrix は 204/204 を 6.6 分で pass しました。Supabase production は local big seed を実行せず全 36 migrations を checksum-verified 済みです。Railway API/worker health と live FCM delivery は未検証です。

### Historical Docker E2E / RAG evidence — 2026-07-13

この section は 2026-07-13 local evidence を保持します。当時 repository は then-current 34 migrations、disposable seed は restaurants 50、drivers 50、customers 100、historical orders 500、専用 worker は RAG documents 402 件を index し、DeepSeek key 不在時は embedding を pending にしました。Supabase production は現在全 36 migrations を適用済みです。Historical zero-step rolled-back row は audit history であり未適用 production change ではありません。

Newer clean-volume worker も fresh seed 後に RAG documents 402 件を index しました。DeepSeek key 未設定のため embedding は pending のままで、fake vector は使っていません。再利用 volume の旧 local run の source ID が null の FAQ 44 件と policy 8 件は historical rows であり、current-worker evidence から除外します。いずれも production data または production embedding/provider approval ではありません。

Historical rebuilt images は三つの project matrix を pass し、latest clean-volume current-source E2E は 204/204（6.6 分）を pass しました。Coverage は axe serious/critical、auth/refresh/RBAC、Customer API order、REST convergence、tenant isolation、map、contract、visual structure、responsive navigation、Restaurant form-login/reload persistence を含みます。Current-head immutable registry provenance は別 gate です。

Provider-backed Railway/Supabase production smoke と controlled-device live FCM は必須で、外部 real-provider configuration/credentials が利用可能になるまで blocked です。

### Historical 2026-07-13 database runtime evidence

Disposable PostGIS + pgvector container は当時 track されていた 33 migrations、PostGIS/vector、`rag_documents`、source/content indexes、cosine HNSW index を確認しました。`db:big-seed` はこの DB に approved restaurants 50、drivers 50、customers 100、orders 509、reviews 123、promotions 10 を生成し、runtime hard-code ではなく DB-backed generator であることを確認しました。Local worker は live restaurant/menu documents 32 件を同期し、DeepSeek key がない場合は fake vector を作らず全件 pending のままにしました。34 番目の FCM-revocation migration はこの historical evidence run に含まれません。

この historical run は current migration state より前です。Supabase production は全 36 migrations を applied/checksum-verified 済みです。ここで示す local seed data は production data ではなく、production contents を推測するために使用してはいけません。

より広い過去の web/browser/container evidence は [release report](batch4-release-report.md) に保持します。Fresh clean-volume current-source matrix は古い 128/134 image result を supersede しました。Provider-backed production smoke と controlled FCM delivery は必須で、release head が変わる場合は関連 evidence を再実行します。

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
