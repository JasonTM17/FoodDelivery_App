# FoodFlow — Nền tảng vận hành giao đồ ăn

Ngôn ngữ: [English](../README.md) · **Tiếng Việt** · [日本語](readme.ja.md)

FoodFlow là hệ thống giao đồ ăn multi-tenant gồm API NestJS, web Admin/Restaurant và ứng dụng Flutter Customer/Driver. Kiến trúc production được thiết kế cho Supabase (PostgreSQL/PostGIS, Realtime, Storage) và Vercel (API, Admin, Restaurant). Docker Compose giữ một profile tương thích riêng cho local/self-hosted bằng Socket.IO, Redis/BullMQ và MinIO.

> **Trạng thái 11/07/2026:** Batch 4 vẫn đang hardening và **chưa deploy production**. Supabase CLI còn thiếu credential, Vercel còn thiếu env production, và GitHub Actions chưa chạy được vì billing/auth hết hạn. Không deploy hoặc fast-forward `master` cho tới khi full gate tại final head và provider preflight đều xanh.

## Xem trước sản phẩm

Ảnh/GIF dưới đây được chụp từ isolated Docker stack của current source với dữ liệu seed deterministic, không phải ảnh production. Xem [gallery đầy đủ](product-gallery.vi.md).

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="Tổng quan Admin FoodFlow" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="Thực đơn Restaurant FoodFlow" width="48%" />
</p>

| Đăng nhập Admin → tổng quan | Đơn hàng Restaurant → thực đơn |
|---|---|
| ![Luồng Admin](media/gifs/admin-login-flow.gif) | ![Luồng Restaurant](media/gifs/restaurant-orders-to-menu.gif) |

## Các ứng dụng

| Bề mặt | Mã nguồn | Runtime | URL local |
|---|---|---|---|
| API | `backend/` | NestJS 11, Prisma 6 | `http://localhost:3001/api` |
| Admin | `web/apps/admin/` | Next.js 15, React 18 | `http://localhost:3000` |
| Restaurant | `web/apps/restaurant/` | Next.js 15, React 18 | `http://localhost:3002` |
| Customer | `mobile/lib/main_customer.dart` | Flutter/Riverpod | thiết bị/emulator |
| Driver | `mobile/lib/main_driver.dart` | Flutter/Riverpod | thiết bị/emulator |

Web dùng route `/:locale` với `vi`, `en`, `ja`. API dùng success envelope `{ success: true, data, meta? }` và RFC 7807 Problem Details cho lỗi.

## Năng lực chính

- Customer: đặt món, giỏ hàng, địa chỉ, voucher, ví/COD/SePay, review, support, AI.
- Driver: online, nhận dispatch, GPS fresh-only, route/ETA, heatmap, thu nhập, KYC, incentive.
- Restaurant: kanban đơn hàng, menu/options, promotion, revenue, review, notification, staff, giờ mở cửa, insight.
- Admin: KPI, đơn hàng, nhà hàng, user, tài xế, bản đồ live, promotion, audit, support, export, AI telemetry.
- Tenant isolation trên staff nhà hàng, realtime channel, tracking, export và tài nguyên quản trị.
- Google Maps/route telemetry thật; thiếu dữ liệu thì UI fail closed, không tự tạo tọa độ, polyline hoặc ETA.
- DeepSeek qua backend adapter; thiếu key hoặc provider lỗi thì fail closed, có telemetry thật và không nhúng key vào client/repo.

## Kiến trúc provider

| Thành phần | Managed production | Local/self-hosted |
|---|---|---|
| Database | Supabase PostgreSQL/PostGIS | PostGIS container |
| Realtime | `REALTIME_PROVIDER=supabase` | `socketio` |
| Storage | `STORAGE_PROVIDER=supabase` | `minio` |
| Queue | `QUEUE_PROVIDER=supabase-postgres` | `bullmq` |

Admin, Restaurant, Customer và Driver lấy credential realtime ngắn hạn, scope theo tenant từ `POST /api/realtime/token` trong managed mode. Mobile gửi GPS/quyết định dispatch qua REST đã xác thực và chỉ nhận event Supabase outbox nằm trong allowlist; Socket.IO chỉ còn là provider explicit cho local/self-hosted.

## Docker Hub và GitHub Packages

Backend và migrator current-head đã được publish bằng SHA immutable lên cả Docker Hub và GHCR; package GHCR đã nối với repository. Admin/Restaurant chưa publish vì env public Supabase bắt buộc còn thiếu, không bake key giả/rỗng vào image.

| Image | Mục đích |
|---|---|
| `nguyenson1710/foodflow-backend` / `ghcr.io/jasontm17/foodflow-backend` | API và worker entry; digest `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` |
| `nguyenson1710/foodflow-migrate` / `ghcr.io/jasontm17/foodflow-migrate` | Prisma migration non-root; digest `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` |
| Admin / Restaurant | Gated cho tới khi có `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã xác minh |

Tag candidate là `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`, hỗ trợ `amd64/arm64`, có SBOM/provenance và cùng digest giữa hai registry. Worker chạy từ backend image với `dist/workers/main.js`, không phải artifact release riêng. `latest` không được dùng làm source of truth cho Batch 4.

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
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

Hoặc chạy full stack: `docker compose up -d --build`.

Health: API `:3001/api/healthz`, Admin `:3000/api/healthz`, Restaurant `:3002/api/healthz`.

## Secret và bảo mật

- Key từng xuất hiện trong chat/log/screenshot/ticket/git phải xem là đã lộ và rotate trước production.
- Không commit `.env`, URL database, service-role key, JWT secret, private key, token provider hoặc mobile signing file.
- Google Maps key và Supabase anon key có thể xuất hiện ở client nhưng phải giới hạn origin/API.
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

Evidence mới nhất trên integration line gồm 48 test backend KYC/config/notification, backend typecheck/lint, đủ 274 Flutter test, Flutter analyze, build APK Driver thật từ `lib/main_driver.dart`, Admin KYC typecheck/contract với 5 component test và OpenAPI Spectral sạch. Evidence web/container/browser rộng hơn vẫn được lưu trong release report, nhưng phải chạy fresh full gate tại final head trước release.

## Thứ tự deploy

1. Khôi phục GitHub Actions và lấy remote checks xanh.
2. Rotate key bị lộ; pass Supabase/Vercel preflight.
3. Deploy Supabase migration, RLS, Realtime publication/channel và Storage policy.
4. Deploy Vercel API, xác minh alias/health/Cron.
5. Deploy Admin/Restaurant với API URL và Supabase public env đã xác minh.
6. Smoke auth, tenant, realtime, bản đồ/route shipper, chatbot, notification, export, payment.
7. Push local integration `HEAD` thẳng vào `origin/master`; remote vẫn chỉ một branch.
8. Publish Docker immutable rồi mới promote `latest`.

## Tài liệu

- [Kiến trúc](system-architecture.md)
- [API contract](api-contract.vi.md)
- [Deployment](deployment-guide.vi.md)
- [Docker/local](docker-local-dev-guide.vi.md)
- [Kiểm thử](testing-guide.vi.md)
- [AI chatbot](ai-chatbot-guide.vi.md)
- [Security](security-audit-guide.vi.md)
- [Roadmap](project-roadmap.vi.md)
- [Branch disposition](branch-disposition.md)
- [Batch 4 report](batch4-release-report.md)

## Chính sách branch

Remote hiện chỉ có `master`. Tại baseline audit 11/07/2026, local `codex/batch4-integration@924808c` là ứng viên fast-forward sạch, ahead `origin/master@df945dd` 106 commit. Không push branch local theo tên vì sẽ tạo branch remote thứ hai; khi toàn bộ gate xanh, push `HEAD` trực tiếp vào `master`. Không raw-merge hoặc xóa branch khi chưa backup và xác minh patch-equivalent.

## License

[MIT](../LICENSE)
