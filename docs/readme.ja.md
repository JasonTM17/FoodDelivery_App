# FoodFlow — フードデリバリー運用プラットフォーム

言語: [English](../README.md) · [Tiếng Việt](readme.vi.md) · **日本語**

FoodFlow は NestJS API、Admin/Restaurant Web、Flutter Customer/Driver を持つ multi-tenant フードデリバリーシステムです。Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）、Railway（API、worker、migrator、Redis）、Vercel（Admin、Restaurant）を使用します。Docker Compose は local/self-hosted 用に Socket.IO、Redis/BullMQ、MinIO の互換 profile を維持します。

> **2026-07-14 status:** Batch 4 は `master` に統合済みです。Supabase production は released migrations 1–35 を applied/checksum-verified 済みで、direct checks は RLS、private Broadcast、split Storage policy、empty production business/RAG data を確認しました。Current source は token と registration capability で FCM revocation を scope する migration 36 を追加し、authorized rollout 待ちです。release は **NO-GO** のままです。Railway API/worker の deploy/verification と controlled-device live FCM は external real-provider configuration/credentials により blocked です。

## Product preview

次の画像/GIF は historical non-production media です。Manifest は `capturedAt` 2026-07-10 を記録していますが source SHA/image reference がないため、current source head や release candidate の証拠にはなりません。[Full gallery](product-gallery.ja.md) を参照してください。

公開 preview は現在 Admin と Restaurant のみです。Customer UI の capture はまだなく、gallery の Driver GPS 画像は test-only local E2E evidence であり、mobile release または production preview ではありません。

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="FoodFlow Admin overview" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="FoodFlow Restaurant menu" width="48%" />
</p>

| Admin login → overview | Restaurant orders → menu |
|---|---|
| ![Admin flow](media/gifs/admin-login-flow.gif) | ![Restaurant flow](media/gifs/restaurant-orders-to-menu.gif) |

## Applications

| Surface | Source | Runtime | Local URL |
|---|---|---|---|
| API | `backend/` | NestJS 11, Prisma 6 | `http://localhost:3001/api` |
| Admin | `web/apps/admin/` | Next.js 15, React 18 | `http://localhost:3000` |
| Restaurant | `web/apps/restaurant/` | Next.js 15, React 18 | `http://localhost:3002` |
| Customer | [`main_customer.dart`](../mobile/lib/main_customer.dart) | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `customer` flavor |
| Driver | [`main_driver.dart`](../mobile/lib/main_driver.dart) | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `driver` flavor |

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

## Provider architecture

| Concern | Managed production | Local/self-hosted |
|---|---|---|
| Database | Supabase PostgreSQL/PostGIS | PostGIS container |
| Realtime | `REALTIME_PROVIDER=supabase` | `socketio` |
| Storage | `STORAGE_PROVIDER=supabase` | `minio` |
| Queue | `QUEUE_PROVIDER=supabase-postgres` | `bullmq` |
| Web basemap | MapLibre + OpenFreeMap | Same provider or self-hosted style |

Managed mode では Admin、Restaurant、Customer、Driver が `POST /api/realtime/token` から短時間・tenant scoped credential を取得します。Mobile の GPS/dispatch decision は authenticated REST で送信し、allowlist 内の Supabase outbox event だけを受信します。Socket.IO は explicit local/self-hosted provider のみです。

## Docker Hub and GitHub Packages

Backend/migrator SHA manifests were published to Docker Hub and repository-linked GHCR packages. They are historical candidates, not evidence for the current `master` head. Admin/Restaurant public Supabase build values are verified, but all four current-head SHA images still await the release workflow. The two private Admin/Restaurant GHCR packages must be connected to this repository and granted workflow write access before rerun.

| Image | Purpose |
|---|---|
| `nguyenson1710/foodflow-backend` / `ghcr.io/jasontm17/foodflow-backend` | API + worker; `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` |
| `nguyenson1710/foodflow-migrate` / `ghcr.io/jasontm17/foodflow-migrate` | non-root Prisma migration; `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` |
| Admin / Restaurant | Immutable Docker SHA と Railway-dependent production smoke は pending。ここでは production health claim を記録しません |

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

2026-07-14 の clean-volume Docker project `foodflow-batch4-e2e` は current source の全 36 migrations を適用し、restaurants 50、drivers 50、customers 100、historical orders 500、canonical orders 9、reviews 123 を seed してから RAG documents 402 件を index しました。full Playwright matrix は 204/204 を 6.6 分で pass しました。これは local current-source evidence です。Supabase production は local big seed を実行せず migrations 1–35 を checksum-verified 済みで、migration 36 は authorized rollout 待ちです。Current-head immutable Docker SHA は pending で、Railway deployment verification、authenticated production GPS/Broadcast smoke、controlled-device live FCM は external provider configuration/credentials により blocked です。

## Deploy order

1. Exposed key を rotate し、Railway の real provider settings 15 件を secret store に登録。
2. Target Supabase で migration 36 を authorized rollout し、FCM revocation の composite capability key を checksum-verify。
3. 必要な real provider configuration が利用可能になった後、同一 immutable SHA の API/worker を deploy して health/readiness/Cron を確認。
4. Live API 経由で private Broadcast allow/deny、token refresh、Storage、GPS snapshot/delta/reconnect、tenant isolation を smoke。
5. Verified Railway に対して exact Admin/Restaurant Vercel deployments、map/route、chatbot、notification、export、payment、controlled-device FCM を smoke。
6. Private Admin/Restaurant GHCR packages を repository に接続して workflow write を付与し、4 immutable SHA images を publish/pull/scan。
7. Production smoke green 後のみ `latest` を promote。

## Documentation

- [Architecture](system-architecture.md)
- [Project overview and requirements](project-overview-pdr.ja.md)
- [API contract](api-contract.ja.md)
- [Deployment](deployment-guide.ja.md)
- [Docker/local](docker-local-dev-guide.ja.md)
- [Testing](testing-guide.ja.md)
- [AI chatbot](ai-chatbot-guide.ja.md)
- [Security](security-audit-guide.ja.md)
- [Roadmap](project-roadmap.ja.md)
- [Branch disposition](branch-disposition.md)
- [Batch 4 report](batch4-release-report.md)

## Branch policy

Remote branch は `master` のみです。Historical local integration/finalization ref と linked integration worktree は残っていません。Branch equivalence は release approval ではありません。Historical integration branch を再作成、raw merge、名前付き push しません。

## License

[MIT](../LICENSE)
