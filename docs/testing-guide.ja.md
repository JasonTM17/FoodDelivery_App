# FoodFlow Testing Guide

## Release rule

Final source head が full local gates、fresh remote CI、provider preflight、production smoke をすべて pass した場合のみ green です。Focused test や historical count、skip 付き script は release approval ではありません。

## Evidence boundary — production 2026-07-16 / historical local 2026-07-14

Current production evidence は runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7` に紐づきます。この revision では remote CI、E2E、Integration Smoke、OpenAPI、security、SBOM、build、multi-architecture runtime smoke、8 件の image scan が green です。以下の post-merge local count と historical role/browser result は範囲を限定した evidence であり、完全な end-to-end production approval ではありません。

| Area           | Result |
| -------------- | ------ |
| Backend        | Current post-merge local gates では Prisma generate/validate、typecheck、ESLint、Nest build が pass。Full Jest は 153 suites pass と gated integration suite 1 件 skip、1,160 tests pass と 1 test skip です。 |
| Database       | Production SHA `a703ece` では repository の 41 migrations がすべて applied、pending はなく、Database、Redis、Supabase Storage readiness は pass です。Candidate migration 42 は disposable PostGIS で semantic FK preflight、clean apply、最終 index の deliberate failure 後の完全 rollback まで検証済みですが、review と synchronized rollout を待つため未 deploy です。Historical rolled-back/checksum-provenance rows は別の audit history です。 |
| Mobile Flutter | Current post-merge lock resolution と `flutter analyze` は issue なし。Full Customer/Driver suite は 373/373 tests pass。Physical Android/iOS device での background location は未認証です。 |
| Web            | Current post-merge frozen install、typecheck、lint、Vercel build-selection tests は pass。Admin は 194/194 tests pass、70 routes build、Restaurant は 135/135 tests pass、55 routes build です。 |
| Historical role/browser smoke | Admin/Restaurant の Chrome と Customer/Driver API による full role smoke、および Chrome desktop、Firefox、Pixel 5 mobile Chrome の clean-volume Playwright 204/204 は source head `17584153ff256b74a3413ae9844f4f27bff038cc` の evidence です。Current `a703ece` に対する four-role production certification としては再実行されていません。 |
| FCM/providers  | Historical local notification/Flutter lifecycle tests は pass。Controlled live FCM、optional provider-backed integrations、physical-device coverage は未検証です。 |
| Production     | Railway migrator `49579ce7-9808-4a35-afcc-82432943bc70`、API `9c823cd9-290a-4eb0-94a2-fdf01c3f0b06`、worker `413dedcc-6ba7-46be-8c99-901f592c558f` は SHA `a703ece` で成功。Vercel Admin `dpl_7CFZKPxtNsYeF1Y6BZmnoJEoXyiF` と Restaurant `dpl_6jqguNYtbVCMVaQ6GvikiceYVsGN` も同じ revision です。Controlled Admin/Driver GPS/Supabase smoke は 5 分間有効な ES256 token、private Broadcast RLS allow/deny、GPS fanout、PostGIS row の永続化、明示的な `poor_accuracy` / `driver_offline` rejection、temporary database/Redis data の完全 cleanup を確認して pass しました。Restaurant health は authenticated Vercel access で正確な revision を返しますが、public Restaurant request は Vercel SSO へ `302` redirect されます。Public Restaurant availability と current revision の full four-role certification は未完了です。 |

### Historical fresh clean-volume Docker evidence — 2026-07-14

Rebuilt clean-volume Docker project `foodflow-batch4-e2e` は当時の 38 migrations を適用し、users 201、restaurants 50、menu items 352、orders 509、reviews 123 を seed、worker は RAG documents 402 件を index しました。Explicit local URLs で source head `17584153ff256b74a3413ae9844f4f27bff038cc` は Chrome desktop 68/68、Firefox 68/68、Pixel 5 mobile Chrome 68/68、合計 204/204、failed/skip なしでした。これは 2026-07-14 local result であり、production test や current `a703ece` certification ではありません。Live FCM と current production の full role journeys は未検証です。

### Web build environment boundary

Root web build は metadata/API client 用の public runtime URLs を意図的に要求し、host を推測しません。`NEXT_PUBLIC_ADMIN_URL` または Restaurant の対応値がない bare build は fail-closed です。local build は [`apps/admin/.env.example`](../web/apps/admin/.env.example) と [`apps/restaurant/.env.example`](../web/apps/restaurant/.env.example) から開始し、non-secret local values のみを使用します。production public values は deployment provider に置き、Docker Compose は build arguments で値を渡します。

### Historical Docker E2E / RAG evidence — 2026-07-13

この section は 2026-07-13 local evidence を保持します。当時 repository は then-current 34 migrations、disposable seed は restaurants 50、drivers 50、customers 100、historical orders 500、専用 worker は RAG documents 402 件を index し、DeepSeek key 不在時は embedding を pending にしました。36 migrations を示す日付付き external provider record はありますが、current provider proof ではありません。Historical zero-step rolled-back row は audit history であり未適用 production change ではありません。

Newer clean-volume worker も fresh seed 後に RAG documents 402 件を index しました。DeepSeek key 未設定のため embedding は pending のままで、fake vector は使っていません。再利用 volume の旧 local run の source ID が null の FAQ 44 件と policy 8 件は historical rows であり、current-worker evidence から除外します。いずれも production data または production embedding/provider approval ではありません。

Historical rebuilt images は三つの project matrix を pass し、source head `17584153ff256b74a3413ae9844f4f27bff038cc` の clean-volume E2E は 204/204（353 秒）を pass しました。Coverage は axe serious/critical、auth/refresh/RBAC、Customer API order、REST convergence、tenant isolation、map、contract、visual structure、responsive navigation、Restaurant form-login/reload persistence を含みます。Current-head immutable registry provenance は別 gate です。

上記の controlled Admin/Driver Railway/Supabase smoke は pass しました。より広い role coverage と controlled-device live FCM は未検証です。FCM/SMTP/Twilio/SePay/DeepSeek/owned routing は certification scope に含む場合だけ設定・test します。Google/OSRM 不在は startup blocker ではなく、routing 503 contract を確認します。

### Historical 2026-07-13 database runtime evidence

Disposable PostGIS + pgvector container は当時 track されていた 33 migrations、PostGIS/vector、`rag_documents`、source/content indexes、cosine HNSW index を確認しました。`db:big-seed` はこの DB に approved restaurants 50、drivers 50、customers 100、orders 509、reviews 123、promotions 10 を生成し、runtime hard-code ではなく DB-backed generator であることを確認しました。Local worker は live restaurant/menu documents 32 件を同期し、DeepSeek key がない場合は fake vector を作らず全件 pending のままにしました。34 番目の FCM-revocation migration はこの historical evidence run に含まれません。

この historical run は current migration state より前です。日付付き external record には Supabase migrations 36 件の checksum verification が記録されていますが、current production では repository の 41 migrations がすべて applied 済みです。ここで示す local seed data は production data ではなく、production contents を推測するために使用してはいけません。

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
