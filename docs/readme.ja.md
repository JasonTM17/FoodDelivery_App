# FoodFlow — フードデリバリー運用プラットフォーム

言語: [English](../README.md) · [Tiếng Việt](readme.vi.md) · **日本語**

FoodFlow は NestJS API、Admin/Restaurant Web、Flutter Customer/Driver を持つ multi-tenant フードデリバリーシステムです。Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）、Railway（API、worker、migrator、Redis）、Vercel（Admin、Restaurant）を使用します。Docker Compose は local/self-hosted 用に Socket.IO、Redis/BullMQ、MinIO の互換 profile を維持します。

> **2026-07-17 recovery snapshot:** Supabase credential rotation と Railway の 6 database URL rollout 後、Railway は SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` で復旧し、health/readiness と 42/42 migration audit は pass しました。Admin/Restaurant は HTTP 200 でしたが revision は `e6def517…` と `977d55f…` に分かれていたため、unified release とは認定していません。Release は tag SHA、`origin/master`、Railway API/worker、両 Vercel health endpoint が一致した場合のみ有効です。Physical device、controlled FCM、active-order routing、optional providers は個別 evidence がない限り certification 対象外です。

## Product preview

FoodFlow には 4 つの product surface があります。[Admin](admin-guide.ja.md)、[Restaurant](restaurant-guide.ja.md)、[Customer](customer-guide.ja.md)、[Driver](driver-guide.ja.md) の guide を選び、[full gallery](product-gallery.ja.md) と [mobile overview](customer-driver-guide.ja.md) を参照してください。Manifest は source head、runtime、capture time、privacy boundary、全 asset の SHA-256 を記録します。Web media の大半は isolated local E2E stack の Google Chrome で取得し、Admin/Restaurant の 2 枚は SHA `17584153` の historical controlled-production evidence として別にラベル付けしています。Mobile media は Android API 35 x86_64 AVD 上の Flutter debug APK で取得し、Driver recovery 1 枚は bounded production-emulator evidence です。Physical device や app-store の認証ではありません。

| Surface    | Runtime                          | 現在の visual evidence                   | 製品の確認方法                                                                                            |
| ---------- | -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Admin      | Next.js web dashboard            | Local PNG 10 枚、GIF 1 件、historical production PNG 1 枚 | [Admin ガイド](admin-guide.ja.md)を読み、Admin web を起動。                            |
| Restaurant | Next.js web dashboard            | Local PNG 10 枚、GIF 1 件、historical production PNG 1 枚 | [Restaurant ガイド](restaurant-guide.ja.md)を読み、Restaurant web を起動。              |
| Customer   | Flutter/Riverpod Android/iOS app | Privacy-reviewed local WebP 9 枚と GIF 2 件 | [Customer ガイド](customer-guide.ja.md)を読み、device/emulator で `main_customer.dart` を起動。            |
| Driver     | Flutter/Riverpod Android/iOS app | Local WebP 7 枚、production-emulator WebP 1 枚、tracking asset 2 件、GIF 1 件 | [Driver ガイド](driver-guide.ja.md)を読み、`main_driver.dart` を起動。            |

Manifest は local、historical production、bounded production-emulator capture を明確に分離します。Release evidence には final clean head の device/emulator recapture が必要であり、限定 evidence を full production certification として扱いません。

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="FoodFlow Admin overview" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="FoodFlow Restaurant menu" width="48%" />
</p>

| Flow | Preview |
|---|---|
| Admin login → overview | ![Admin flow](media/gifs/admin-login-flow.gif) |
| Restaurant orders → menu | ![Restaurant flow](media/gifs/restaurant-orders-to-menu.gif) |
| Customer sign-in → registration → sign-in | ![Customer authentication flow](media/gifs/customer-auth-flow.gif) |
| Driver sign-in → Home → Earnings → Profile | ![Driver flow](media/gifs/driver-role-flow.gif) |

## Applications

| Surface    | Source                                                   | Runtime                                          | Local URL                                  | Primary guide                                           |
| ---------- | -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| API        | `backend/`                                               | NestJS 11, Prisma 6                              | `http://localhost:3001/api`                | —                                                       |
| Admin      | `web/apps/admin/`                                        | Next.js 15, React 18                             | `http://localhost:3000`                    | [Admin ガイド](admin-guide.ja.md)                        |
| Restaurant | `web/apps/restaurant/`                                   | Next.js 15, React 18                             | `http://localhost:3002`                    | [Restaurant ガイド](restaurant-guide.ja.md)              |
| Customer   | [`main_customer.dart`](../mobile/lib/main_customer.dart) | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `customer` flavor | [Customer（注文者）ガイド](customer-guide.ja.md)        |
| Driver     | [`main_driver.dart`](../mobile/lib/main_driver.dart)     | Flutter/Riverpod native mobile app (Android/iOS) | device/emulator; Android `driver` flavor   | [Driver ガイド](driver-guide.ja.md)                      |

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

## Immutable Docker artifacts — SHA 84eeac3

Docker Publish run `29515529360` は AMD64/ARM64 の build、runtime smoke、High/Critical scan、immutable SHA publish を完了しました。`latest` と semver aliases は変更していません。

| Artifact | Docker Hub digest |
| --- | --- |
| `foodflow-backend` | `sha256:09bae57f907fc6d13c9874a673a8d73397510e3d50f75b6f20415e948285c24e` |
| `foodflow-migrate` | `sha256:04a089f17269d8ceb94f3f55cb241c91e0eb16db68ffaae4067c8f9a7bbbe16d` |
| `foodflow-admin` | `sha256:1f75f3fd4cd6b9cc4b0814efee3aab79643f5f9ce6962cabd1505ef57c4992db` |
| `foodflow-restaurant` | `sha256:d92f6b8baaccc0a7ae8f83a22bff4d5d949fa07f6242fa456616465b44059316` |

Worker は backend image の `dist/workers/main.js` を使用し、別 release artifact ではありません。Old candidate evidence は [release report](batch4-release-report.md) に保持し、新しい rollout の source には使用しません。

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

# Terminal A: Admin
cd ../web
corepack pnpm install --frozen-lockfile
corepack pnpm --filter foodflow-admin dev --port 3000

# Terminal B: Restaurant（install 後、repository root から実行）
cd web
corepack pnpm --filter restaurant dev --port 3002

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

2026-07-14 の clean-volume Docker project `foodflow-batch4-e2e` は当時 current の 36 migrations を適用し、users 201、restaurants 50、menu items 352、orders 509、reviews 123 を seed、RAG documents 402 件を index し、Playwright 204/204 を 353 秒で pass しました。Migrations 37–38 と mobile fixes の後、disposable fresh database は全 38 と default-address invariant を passし、`flutter analyze` は clean、Customer/Driver full suite は 369 tests を passしました。Final clean head の full Docker/Playwright 再実行が必要で、remote provider、deployed image、Firebase live delivery は未検証です。

## Deploy order

1. Exposed key を rotate し、設定済み Railway/provider values は sealed secret store のみに保持。
2. Storage checksum provenance は Git blob `c29c069ea180ed6c3107411759b8ceb2150dc8e7` から byte-for-byte で復元され、production audit は 42/42 で pass する。今後も backup 後にのみ migration rollout を行い、`prisma migrate resolve` で新しい drift を隠さない。
3. Verified Railway API/worker deployments を保持し、次回 release は同一 immutable SHA から deploy して health/readiness/worker polling を再確認。
4. Live API 経由で private Broadcast allow/deny、token refresh、Storage、GPS snapshot/delta/reconnect、tenant isolation を smoke。
5. Current Railway API に対して exact Admin/Restaurant Vercel deployments、configured map/route、chatbot、notification、export、payment、controlled-device FCM を smoke。
6. Private Admin/Restaurant GHCR packages を repository に接続して workflow write を付与し、4 immutable SHA images を publish/pull/scan。
7. Production smoke green 後のみ `latest` を promote。

## Documentation

- [Admin ガイド](admin-guide.ja.md) — platform operation、support、report、export、settings
- [Restaurant ガイド](restaurant-guide.ja.md) — orders、menu、staff permission、revenue、settings
- [Customer（注文者）ガイド](customer-guide.ja.md) — ordering、permission、地図での住所選択、checkout、tracking、support
- [Driver ガイド](driver-guide.ja.md) — onboarding、Online/GPS、dispatch、earnings、profile
- [Product gallery](product-gallery.ja.md) と [mobile overview](customer-driver-guide.ja.md)
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
