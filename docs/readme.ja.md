# FoodFlow — フードデリバリー運用プラットフォーム

言語: [English](../README.md) · [Tiếng Việt](readme.vi.md) · **日本語**

FoodFlow は NestJS API、Admin/Restaurant Web、Flutter Customer/Driver を持つ multi-tenant フードデリバリーシステムです。Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）、Railway（API、worker、migrator、Redis）、Vercel（Admin、Restaurant）を使用します。Docker Compose は local/self-hosted 用に Socket.IO、Redis/BullMQ、MinIO の互換 profile を維持します。

> **2026-07-14 status:** runtime candidate `52f433641d5093f6d064cfba6c1cd99c8cb035e9` は 144 suites / 1065 tests、typecheck、lint、build、trigger された GitHub workflows、multi-architecture runtime smoke、High/Critical image scans を pass。Railway migrate/API/worker は immutable SHA images で稼働し、38 migrations と database/Redis/Supabase Storage readiness を確認。Current Vercel Admin/Restaurant は Ready、health/login は 200。Controlled production GPS は private Supabase Broadcast と PostGIS に 1437 ms で到達し、一時データは削除済みです。Full production certification には controlled-device FCM、Android/iOS background-location matrix、authenticated browser journeys、certification scope の payment/messaging/AI/owned-routing integrations が必要です。

## Product preview

FoodFlow には 4 つの product surface があります。次の画像/GIF は historical non-production media です。Manifest は `capturedAt` 2026-07-10 を記録していますが source SHA/image reference がないため、current source head や release candidate の証拠にはなりません。注文アプリはまず [Customer（注文者）ガイド](customer-guide.ja.md) を読み、その後 [Full gallery](product-gallery.ja.md) と [Customer/Driver overview](customer-driver-guide.ja.md) を参照してください。

| Surface    | Runtime                          | 現在の visual evidence                   | 製品の確認方法                                                                                            |
| ---------- | -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Admin      | Next.js web dashboard            | Historical stills and GIF                | Admin web を起動し、gallery を確認。                                                                      |
| Restaurant | Next.js web dashboard            | Historical stills and GIF                | Restaurant web を起動し、gallery を確認。                                                                 |
| Customer   | Flutter/Riverpod Android/iOS app | test-only Android emulator still 1 件    | [Customer（注文者）ガイド](customer-guide.ja.md) を読み、device/emulator で `main_customer.dart` を起動。 |
| Driver     | Flutter/Riverpod Android/iOS app | test-only Android emulator captures 4 件 | `main_driver.dart` を起動。既存 GPS/notification 画像は release media ではない。                          |

Mobile captures は simulated GPS と local stack を使用し、manifest は dirty workspace と明記します。Release evidence には final clean head の device/emulator recapture が必要です。Local evidence を production として扱いません。

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="FoodFlow Admin overview" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="FoodFlow Restaurant menu" width="48%" />
</p>

| Admin login → overview                         | Restaurant orders → menu                                     |
| ---------------------------------------------- | ------------------------------------------------------------ |
| ![Admin flow](media/gifs/admin-login-flow.gif) | ![Restaurant flow](media/gifs/restaurant-orders-to-menu.gif) |

## Applications

| Surface    | Source                                                   | Runtime                                          | Local URL                                  | Primary guide                                           |
| ---------- | -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| API        | `backend/`                                               | NestJS 11, Prisma 6                              | `http://localhost:3001/api`                | —                                                       |
| Admin      | `web/apps/admin/`                                        | Next.js 15, React 18                             | `http://localhost:3000`                    | —                                                       |
| Restaurant | `web/apps/restaurant/`                                   | Next.js 15, React 18                             | `http://localhost:3002`                    | —                                                       |
| Customer   | [`main_customer.dart`](../mobile/lib/main_customer.dart) | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `customer` flavor | [Customer（注文者）ガイド](customer-guide.ja.md)        |
| Driver     | [`main_driver.dart`](../mobile/lib/main_driver.dart)     | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `driver` flavor   | [Customer / Driver ガイド](customer-driver-guide.ja.md) |

Customer と Driver に local web URL はありません。明示的な Flutter entrypoint を使用し、下記の `--flavor` command は Android product flavor を選択します。

Web route は `vi`、`en`、`ja` の `/:locale` prefix を使用します。API success は `{ success: true, data, meta? }`、error は RFC 7807 Problem Details です。

## Main capabilities

- Customer ordering、cart、address、voucher、wallet/COD/SePay、review、support、AI。
- Driver online/dispatch、fresh GPS validation、route/ETA、heatmap、earnings、KYC、incentive。
- Restaurant order kanban、menu/options、promotion、revenue、review、notification、staff、opening hours、insight。
- Admin KPI、order、restaurant、user、driver、live map、promotion、audit、support、export、AI telemetry。
- Restaurant staff、realtime channel、tracking、export、admin resource の tenant isolation。
- Basemap は key/billing 不要の MapLibre/OpenFreeMap を使用し、GPS・route・ETA は実 backend telemetry のみを使って不足時は fail closed。
- DeepSeek は backend adapter 経由です。Key 不足または provider error は fail closed とし、実 telemetry を保存し、client/repo に key を埋め込みません。

Google Maps は起動要件ではありません。Google Directions と owned OSRM の両方が未設定の場合、route calculation は `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` を返しますが、API/worker は healthy のままです。DeepSeek credential がないため、Railway は現在 `RAG_ENABLED=false` です。

## Provider architecture

| Concern     | Managed production                 | Local/self-hosted                  |
| ----------- | ---------------------------------- | ---------------------------------- |
| Database    | Supabase PostgreSQL/PostGIS        | PostGIS container                  |
| Realtime    | `REALTIME_PROVIDER=supabase`       | `socketio`                         |
| Storage     | `STORAGE_PROVIDER=supabase`        | `minio`                            |
| Queue       | `QUEUE_PROVIDER=supabase-postgres` | `bullmq`                           |
| Web basemap | MapLibre + OpenFreeMap             | Same provider or self-hosted style |

Managed mode では Admin、Restaurant、Customer、Driver が `POST /api/realtime/token` から短時間・tenant scoped credential を取得します。Mobile の GPS/dispatch decision は authenticated REST で送信し、server が JWT で許可された channel に private Supabase Broadcast を送信します。Socket.IO は explicit local/self-hosted provider のみです。

## Docker Hub and GitHub Packages

Evidence commit `ed25399` の 4 images は Docker Hub と public GHCR に publish 済みです。各 package は `JasonTM17/FoodDelivery_App` に link、Actions write 済みで、multi-architecture digest は両 registry で一致します。これは artifact evidence であり Railway production health の証明ではありません。`latest` は未 promote です。

| Image                                                                         | Purpose                                                                                              |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `nguyenson1710/foodflow-backend` / `ghcr.io/jasontm17/foodflow-backend`       | API + worker; `sha256:b1a24c929d7178548c407c019aa75347da78fe5c1dd135177f2b5e4024e4143b`              |
| `nguyenson1710/foodflow-migrate` / `ghcr.io/jasontm17/foodflow-migrate`       | non-root Prisma migration; `sha256:feb11569b66cb88cdeafbc92c3e64ca9eaed8801859f42f3600237eb55ad3bb4` |
| `nguyenson1710/foodflow-admin` / `ghcr.io/jasontm17/foodflow-admin`           | Admin; `sha256:43d8908d5a77efb7142744ce76ce6355631a3b406b5e8d5e6bed884a4ac02b12`                     |
| `nguyenson1710/foodflow-restaurant` / `ghcr.io/jasontm17/foodflow-restaurant` | Restaurant; `sha256:7ba5838752a699f7dd3fb46d98110b2b37ef0c6a53f6f21aa2493c9e398da97e`                |

Historical candidate tag is `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`; both registries resolved to the same `amd64/arm64` manifest with SBOM/provenance. Worker は backend image の `dist/workers/main.js` を使い、別 release artifact ではありません。`latest` は Batch 4 の source of truth ではありません。

Release は `sha-<full-commit>` multi-arch build → `amd64/arm64` runtime smoke → High/Critical Trivy block → production health → immutable `v4.0.0` → manual `latest` promotion の順です。

## Local development

Node.js 22.13+、pnpm 11.11.0、Docker、Flutter SDK が必要です。実 secret は ignored `.env` または secret manager のみに保存します。

```bash
docker compose up -d postgres redis minio

cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm prisma migrate dev
corepack pnpm db:seed
corepack pnpm start:dev

cd ../web
corepack pnpm install --frozen-lockfile
corepack pnpm dev

cd ../mobile
flutter pub get --enforce-lockfile
flutter run --flavor customer -t lib/main_customer.dart
flutter run --flavor driver -t lib/main_driver.dart
```

Full stack は `docker compose up -d --build`。Health は API `:3001/api/healthz`、Admin `:3000/api/healthz`、Restaurant `:3002/api/healthz` です。

## Secrets and security

- Chat、log、screenshot、ticket、git history に貼られた key は exposed として production 前に rotate します。
- `.env`、database URL、service-role key、JWT secret、private key、provider token、mobile signing file を commit しません。
- OpenFreeMap は browser key/billing 不要です。Supabase anon/publishable key は RLS と適切な origin control を必須とします。
- DeepSeek、Supabase service role/JWT、SePay、SMTP、FCM、Twilio、deploy credential は server-side secret manager のみです。

```powershell
powershell -File infra/scripts/supabase-preflight.ps1
powershell -File infra/scripts/vercel-web-preflight.ps1
```

## Test gates

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Gate は frozen install、Prisma、backend typecheck/lint/Jest/build、web typecheck/ESLint/Vitest/build、OpenAPI Spectral、Compose、Playwright Chromium/Firefox、Flutter analyze/test、secret scan を含みます。Release にはさらに axe serious/critical = 0、visual、tenant isolation、realtime auth、shipper map/route、AI smoke、multi-arch image scan が必要です。

2026-07-14 の clean-volume Docker project `foodflow-batch4-e2e` は当時 current の 36 migrations を適用し、users 201、restaurants 50、menu items 352、orders 509、reviews 123 を seed、RAG documents 402 件を index し、Playwright 204/204 を 353 秒で pass しました。Migrations 37–38 と mobile fixes の後、disposable fresh database は全 38 と default-address invariant を passし、`flutter analyze` は clean、Customer/Driver full suite は 367 tests を passしました。Final clean head の full Docker/Playwright 再実行が必要で、remote provider、deployed image、Firebase live delivery は未検証です。

## Deploy order

1. Exposed key を rotate し、設定済み Railway/provider values は sealed secret store のみに保持。
2. 承認された production migration environment で全 migration を apply/verify する。local Docker から provider state を推測しない。
3. Verified Railway API/worker deployments を保持し、次回 release は同一 immutable SHA から deploy して health/readiness/worker polling を再確認。
4. Live API 経由で private Broadcast allow/deny、token refresh、Storage、GPS snapshot/delta/reconnect、tenant isolation を smoke。
5. Current Railway API に対して exact Admin/Restaurant Vercel deployments、configured map/route、chatbot、notification、export、payment、controlled-device FCM を smoke。
6. Private Admin/Restaurant GHCR packages を repository に接続して workflow write を付与し、4 immutable SHA images を publish/pull/scan。
7. Production smoke green 後のみ `latest` を promote。

## Documentation

- [Customer（注文者）ガイド](customer-guide.ja.md) — ordering、permission、地図での住所選択、checkout、tracking、support
- [Architecture (EN)](system-architecture.md)
- [Project overview and requirements](project-overview-pdr.ja.md)
- [API contract](api-contract.ja.md)
- [Deployment](deployment-guide.ja.md)
- [Docker/local](docker-local-dev-guide.ja.md)
- [Testing](testing-guide.ja.md)
- [AI chatbot](ai-chatbot-guide.ja.md)
- [Security](security-audit-guide.ja.md)
- [Roadmap](project-roadmap.ja.md)
- [Branch disposition (EN)](branch-disposition.md)
- [Batch 4 report (EN)](batch4-release-report.md)

## Branch policy

Remote branch は `master` のみです。Historical local integration/finalization ref と linked integration worktree は残っていません。Branch equivalence は release approval ではありません。Historical integration branch を再作成、raw merge、名前付き push しません。

## License

[MIT](../LICENSE)
