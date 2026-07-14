# FoodFlow — Nền tảng vận hành giao đồ ăn

Ngôn ngữ: [English](../README.md) · **Tiếng Việt** · [日本語](readme.ja.md)

FoodFlow là hệ thống giao đồ ăn multi-tenant gồm API NestJS, web Admin/Restaurant và ứng dụng Flutter Customer/Driver. Kiến trúc production dùng Supabase (PostgreSQL/PostGIS, Realtime, Storage), Railway (API, worker, migrator, Redis) và Vercel (Admin, Restaurant). Docker Compose giữ một profile tương thích riêng cho local/self-hosted bằng Socket.IO, Redis/BullMQ và MinIO.

> **Trạng thái 14/07/2026:** Stack volume sạch trước đó áp dụng 36 migration hiện hành lúc chạy và pass Playwright 204/204. Worktree hiện tại thêm migration 37–38; database tạm volume sạch đã apply đủ 38 và invariant địa chỉ mặc định pass. Đây **không** phải chứng nhận production. Release vẫn **NO-GO** cho tới khi provider apply đúng migration/release candidate, chạy smoke production có xác thực và gửi FCM đến thiết bị kiểm soát.

## Xem trước sản phẩm

FoodFlow có bốn bề mặt sản phẩm. Ảnh/GIF dưới đây là media lịch sử, không phải ảnh production: manifest ghi `capturedAt` 2026-07-10 nhưng không có source SHA/image reference, nên không chứng minh current source head hay release candidate. Bắt đầu với [hướng dẫn Khách hàng](customer-guide.vi.md) cho ứng dụng đặt món, sau đó xem [gallery đầy đủ](product-gallery.vi.md) và [tổng quan Customer/Driver](customer-driver-guide.vi.md).

| Bề mặt | Runtime | Bằng chứng trực quan hiện có | Cách xem sản phẩm |
|---|---|---|---|
| Admin | Dashboard web Next.js | Ảnh tĩnh và GIF lịch sử | Chạy ứng dụng Admin web; xem gallery. |
| Restaurant | Dashboard web Next.js | Ảnh tĩnh và GIF lịch sử | Chạy ứng dụng Restaurant web; xem gallery. |
| Customer | Ứng dụng Flutter/Riverpod Android/iOS | Một ảnh Android emulator chỉ phục vụ test | Đọc [hướng dẫn Khách hàng](customer-guide.vi.md), rồi chạy `main_customer.dart` trên thiết bị/emulator. |
| Driver | Ứng dụng Flutter/Riverpod Android/iOS | Bốn ảnh Android emulator chỉ phục vụ test | Chạy `main_driver.dart`; ảnh GPS/notification hiện có không phải media release. |

Ảnh mobile dùng GPS mô phỏng và local stack; manifest ghi rõ worktree còn dirty. Muốn có bằng chứng release phải capture lại từ clean head trên thiết bị/emulator của release candidate. Tài liệu không gắn bằng chứng local thành production.

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="Tổng quan Admin FoodFlow" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="Thực đơn Restaurant FoodFlow" width="48%" />
</p>

| Đăng nhập Admin → tổng quan | Đơn hàng Restaurant → thực đơn |
|---|---|
| ![Luồng Admin](media/gifs/admin-login-flow.gif) | ![Luồng Restaurant](media/gifs/restaurant-orders-to-menu.gif) |

## Các ứng dụng

| Bề mặt | Mã nguồn | Runtime | URL local | Hướng dẫn chính |
|---|---|---|---|---|
| API | `backend/` | NestJS 11, Prisma 6 | `http://localhost:3001/api` | — |
| Admin | `web/apps/admin/` | Next.js 15, React 18 | `http://localhost:3000` | — |
| Restaurant | `web/apps/restaurant/` | Next.js 15, React 18 | `http://localhost:3002` | — |
| Customer | [`main_customer.dart`](../mobile/lib/main_customer.dart) | Ứng dụng mobile Flutter/Riverpod native (Android/iOS) | thiết bị/emulator; Android flavor `customer` | [Hướng dẫn Khách hàng](customer-guide.vi.md) |
| Driver | [`main_driver.dart`](../mobile/lib/main_driver.dart) | Ứng dụng mobile Flutter/Riverpod native (Android/iOS) | thiết bị/emulator; Android flavor `driver` | [Hướng dẫn Customer/Driver](customer-driver-guide.vi.md) |

Customer và Driver không có URL web local. Dùng entrypoint Flutter tường minh; lệnh `--flavor` bên dưới chọn Android product flavor.

Web dùng route `/:locale` với `vi`, `en`, `ja`. API dùng success envelope `{ success: true, data, meta? }` và RFC 7807 Problem Details cho lỗi.

## Năng lực chính

- Customer: đặt món, giỏ hàng, địa chỉ, voucher, ví/COD/SePay, review, support, AI.
- Driver: online, nhận dispatch, GPS fresh-only, route/ETA, heatmap, thu nhập, KYC, incentive.
- Restaurant: kanban đơn hàng, menu/options, promotion, revenue, review, notification, staff, giờ mở cửa, insight.
- Admin: KPI, đơn hàng, nhà hàng, user, tài xế, bản đồ live, promotion, audit, support, export, AI telemetry.
- Tenant isolation trên staff nhà hàng, realtime channel, tracking, export và tài nguyên quản trị.
- MapLibre/OpenFreeMap hiển thị nền bản đồ không cần key/billing; GPS, route và ETA vẫn chỉ lấy từ backend thật và fail closed khi thiếu.
- DeepSeek qua backend adapter; thiếu key hoặc provider lỗi thì fail closed, có telemetry thật và không nhúng key vào client/repo.

## Kiến trúc provider

| Thành phần | Managed production | Local/self-hosted |
|---|---|---|
| Database | Supabase PostgreSQL/PostGIS | PostGIS container |
| Realtime | `REALTIME_PROVIDER=supabase` | `socketio` |
| Storage | `STORAGE_PROVIDER=supabase` | `minio` |
| Queue | `QUEUE_PROVIDER=supabase-postgres` | `bullmq` |
| Basemap web | MapLibre + OpenFreeMap | Cùng provider hoặc style tự host |

Admin, Restaurant, Customer và Driver lấy credential realtime ngắn hạn, scope theo tenant từ `POST /api/realtime/token` trong managed mode. Mobile gửi GPS/quyết định dispatch qua REST đã xác thực và nhận private Supabase Broadcast do server gửi tới các kênh mà JWT cho phép; Socket.IO chỉ còn là provider explicit cho local/self-hosted.

## Docker Hub và GitHub Packages

Backend và migrator từng được publish bằng SHA immutable lên Docker Hub và GHCR; đây là candidate lịch sử, không phải bằng chứng cho `master` hiện tại. Env public Supabase của Admin/Restaurant đã được xác minh, nhưng bốn image current-head vẫn chờ pipeline publish SHA. Hai package GHCR private của Admin/Restaurant phải được nối với repository và cấp workflow write access trước khi rerun.

| Image | Mục đích |
|---|---|
| `nguyenson1710/foodflow-backend` / `ghcr.io/jasontm17/foodflow-backend` | API và worker entry; digest `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` |
| `nguyenson1710/foodflow-migrate` / `ghcr.io/jasontm17/foodflow-migrate` | Prisma migration non-root; digest `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` |
| Admin / Restaurant | Immutable Docker SHA và Railway-dependent production smoke vẫn chờ; không ghi nhận claim production health ở đây |

Tag candidate lịch sử là `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`, hỗ trợ `amd64/arm64`, có SBOM/provenance và cùng digest giữa hai registry. Worker chạy từ backend image với `dist/workers/main.js`, không phải artifact release riêng. `latest` không được dùng làm source of truth cho Batch 4.

Pipeline release: push `sha-<full-commit>` multi-arch → runtime smoke `amd64/arm64` → Trivy chặn High/Critical → production health → tạo tag immutable `v4.0.0` → chỉ promote `latest` bằng thao tác manual sau smoke.

## Chạy local

Yêu cầu Node.js 22.13+, pnpm 11.11.0, Docker và Flutter SDK. Secret thật chỉ nằm trong `.env` bị ignore hoặc secret manager.

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

Hoặc chạy full stack: `docker compose up -d --build`.

Health: API `:3001/api/healthz`, Admin `:3000/api/healthz`, Restaurant `:3002/api/healthz`.

## Secret và bảo mật

- Key từng xuất hiện trong chat/log/screenshot/ticket/git phải xem là đã lộ và rotate trước production.
- Không commit `.env`, URL database, service-role key, JWT secret, private key, token provider hoặc mobile signing file.
- OpenFreeMap không cần browser key hay billing. Supabase anon/publishable key vẫn phải được bảo vệ bằng RLS và origin phù hợp.
- DeepSeek, Supabase service role/JWT, SePay, SMTP, FCM, Twilio và deploy token chỉ ở server-side secret manager.

Preflight không in value:

```powershell
powershell -File infra/scripts/supabase-preflight.ps1
powershell -File infra/scripts/vercel-web-preflight.ps1
```

## Gate kiểm thử

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Gate bao gồm frozen install, Prisma, backend typecheck/lint/Jest/build, web typecheck/ESLint/Vitest/build, OpenAPI Spectral, Compose config, Playwright Chromium/Firefox, Flutter analyze/test và secret scan. Release còn yêu cầu axe serious/critical = 0, visual regression, tenant isolation, realtime authorization, bản đồ/route shipper, AI smoke và image scan multi-arch.

Lần chạy Docker volume sạch ngày 14/07/2026 của project `foodflow-batch4-e2e` đã apply 36 migration hiện hành lúc chạy, seed 201 user, 50 restaurant, 352 menu item, 509 order và 123 review, rồi index 402 RAG document. Ma trận Playwright pass 204/204 trong 353 giây. Sau khi thêm migration 37–38 và các fix mobile, database tạm mới apply đủ 38 migration và từ chối default address thứ hai; `flutter analyze` vẫn sạch và toàn bộ suite Customer/Driver pass 367 test. Vẫn phải chạy lại full Docker/Playwright trên clean head cuối. Bằng chứng local không xác minh provider từ xa, image đã deploy hay Firebase live.

## Thứ tự deploy

1. Rotate key bị lộ và cấu hình các giá trị Railway/provider cần thiết qua secret store.
2. Apply và xác minh tất cả migration qua môi trường migration production đã được duyệt; không suy luận trạng thái provider từ Docker local.
3. Deploy API/worker cùng một SHA immutable, rồi kiểm health/readiness/Cron khi đã có đủ cấu hình provider thật.
4. Smoke Supabase Broadcast private allow/deny, token refresh, Storage, GPS snapshot/delta/reconnect và tenant isolation qua API live.
5. Smoke lại đúng deployment Vercel Admin/Restaurant với Railway đã xác minh, rồi kiểm map/route, chatbot, notification, export, payment và FCM thiết bị kiểm soát.
6. Nối hai package GHCR Admin/Restaurant với repository, cấp workflow write, rồi publish/pull/scan bốn image SHA immutable.
7. Chỉ promote `latest` sau khi production smoke xanh.

## Tài liệu

- [Hướng dẫn Khách hàng](customer-guide.vi.md) — đặt món, quyền, chọn địa chỉ trên bản đồ, checkout, tracking và hỗ trợ
- [Kiến trúc (EN)](system-architecture.md)
- [Tổng quan và yêu cầu sản phẩm](project-overview-pdr.vi.md)
- [API contract](api-contract.vi.md)
- [Deployment](deployment-guide.vi.md)
- [Docker/local](docker-local-dev-guide.vi.md)
- [Kiểm thử](testing-guide.vi.md)
- [AI chatbot](ai-chatbot-guide.vi.md)
- [Security](security-audit-guide.vi.md)
- [Roadmap](project-roadmap.vi.md)
- [Branch disposition (EN)](branch-disposition.md)
- [Batch 4 report (EN)](batch4-release-report.md)

## Chính sách branch

Remote chỉ có `master`. Không còn local ref integration/finalization lịch sử hoặc linked integration worktree. Branch equivalence không phải release approval; không tạo lại, raw-merge hoặc push branch integration lịch sử theo tên.

## License

[MIT](../LICENSE)
