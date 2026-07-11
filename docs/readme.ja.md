# FoodFlow — フードデリバリー運用プラットフォーム

言語: [English](../README.md) · [Tiếng Việt](readme.vi.md) · **日本語**

FoodFlow は NestJS API、Admin/Restaurant Web、Flutter Customer/Driver を持つ multi-tenant フードデリバリーシステムです。Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）と Vercel（API、Admin、Restaurant）を使用します。Docker Compose は local/self-hosted 用に Socket.IO、Redis/BullMQ、MinIO の互換 profile を維持します。

> **2026-07-11 status:** Batch 4 hardening は継続中で、**production deploy は未実施**です。Supabase CLI credential、Vercel production env、GitHub Actions billing/auth が不足しています。Final head の full gate と provider preflight がすべて green になるまで deploy と `master` fast-forward は fail closed です。

## Product preview

次の画像/GIF は current-source isolated Docker stack と deterministic seed data から取得したもので、production screenshot ではありません。[Full gallery](product-gallery.ja.md) を参照してください。

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
| Customer | `mobile/lib/main_customer.dart` | Flutter/Riverpod | device/emulator |
| Driver | `mobile/lib/main_driver.dart` | Flutter/Riverpod | device/emulator |

Web route は `vi`、`en`、`ja` の `/:locale` prefix を使用します。API success は `{ success: true, data, meta? }`、error は RFC 7807 Problem Details です。

## Main capabilities

- Customer ordering、cart、address、voucher、wallet/COD/SePay、review、support、AI。
- Driver online/dispatch、fresh GPS validation、route/ETA、heatmap、earnings、KYC、incentive。
- Restaurant order kanban、menu/options、promotion、revenue、review、notification、staff、opening hours、insight。
- Admin KPI、order、restaurant、user、driver、live map、promotion、audit、support、export、AI telemetry。
- Restaurant staff、realtime channel、tracking、export、admin resource の tenant isolation。
- Google Maps と実 telemetry を使用し、座標・polyline・ETA が不足すると fake fallback を作らず fail closed。
- DeepSeek は backend adapter 経由です。Key 不足または provider error は fail closed とし、実 telemetry を保存し、client/repo に key を埋め込みません。

## Provider architecture

| Concern | Managed production | Local/self-hosted |
|---|---|---|
| Database | Supabase PostgreSQL/PostGIS | PostGIS container |
| Realtime | `REALTIME_PROVIDER=supabase` | `socketio` |
| Storage | `STORAGE_PROVIDER=supabase` | `minio` |
| Queue | `QUEUE_PROVIDER=supabase-postgres` | `bullmq` |

Managed mode では Admin、Restaurant、Customer、Driver が `POST /api/realtime/token` から短時間・tenant scoped credential を取得します。Mobile の GPS/dispatch decision は authenticated REST で送信し、allowlist 内の Supabase outbox event だけを受信します。Socket.IO は explicit local/self-hosted provider のみです。

## Docker Hub

検証済み registry path は Docker Hub のみです。GHCR package は独立検証されるまで掲載しません。

| Image | Purpose |
|---|---|
| `nguyenson1710/foodflow-backend` | API + worker entry |
| `nguyenson1710/foodflow-migrate` | non-root Prisma migration |
| `nguyenson1710/foodflow-admin` | Admin standalone |
| `nguyenson1710/foodflow-restaurant` | Restaurant standalone |

Worker は backend image の `dist/workers/main.js` を使い、別 release artifact ではありません。Docker Hub `latest` は古い code を指しているため、Batch 4 の source of truth ではありません。

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
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

Full stack は `docker compose up -d --build`。Health は API `:3001/api/healthz`、Admin `:3000/api/healthz`、Restaurant `:3002/api/healthz` です。

## Secrets and security

- Chat、log、screenshot、ticket、git history に貼られた key は exposed として production 前に rotate します。
- `.env`、database URL、service-role key、JWT secret、private key、provider token、mobile signing file を commit しません。
- Browser の Google Maps key と Supabase anon key は origin/API restriction を設定します。
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

最新 integration evidence は backend KYC/config/notification 48 tests、backend typecheck/lint、Flutter 274 tests、Flutter analyze、`lib/main_driver.dart` からの実 Driver debug APK build、Admin KYC contract/typecheck と 5 component tests、clean OpenAPI Spectral です。より広い web/container/browser evidence は release report に残しますが、release 前に final head の fresh full gate が必要です。

## Deploy order

1. GitHub Actions billing/auth を復旧し remote checks を green にする。
2. Exposed key を rotate し Supabase/Vercel preflight を pass。
3. Supabase migration、RLS、Realtime publication/channel、Storage policy を deploy。
4. Vercel API と verified alias/health/Cron を確認。
5. Verified API/Supabase public env で Admin/Restaurant を deploy。
6. Auth、tenant、realtime、shipper route、chatbot、notification、export、payment を smoke。
7. Local integration `HEAD` を直接 `origin/master` へ push し remote branch を一つに保つ。
8. Immutable Docker manifests を publish し、production smoke 後だけ `latest` を更新。

## Documentation

- [Architecture](system-architecture.md)
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

Remote branch は `master` の一つだけです。2026-07-11 audit baseline では local `codex/batch4-integration@924808c` が `origin/master@df945dd` より 106 commits ahead の clean fast-forward candidate です。二つ目の remote branch を作らないため local branch 名では push せず、全 gate が green になった後に verified `HEAD` を直接 `master` へ push します。Backup と patch-equivalence 確認なしで raw merge/delete は行いません。

## License

[MIT](../LICENSE)
