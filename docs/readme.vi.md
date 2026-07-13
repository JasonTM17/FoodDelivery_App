# FoodFlow — Nền tảng vận hành giao đồ ăn

Ngôn ngữ: [English](../README.md) · **Tiếng Việt** · [日本語](readme.ja.md)

FoodFlow là hệ thống giao đồ ăn multi-tenant gồm API NestJS, web Admin/Restaurant và ứng dụng Flutter Customer/Driver. Kiến trúc production dùng Supabase (PostgreSQL/PostGIS, Realtime, Storage), Railway (API, worker, migrator, Redis) và Vercel (Admin, Restaurant). Docker Compose giữ một profile tương thích riêng cho local/self-hosted bằng Socket.IO, Redis/BullMQ và MinIO.

> **Trạng thái 13/07/2026:** Batch 4 đã được tích hợp vào `master` nhưng **chưa deploy production**. Docker E2E current-source trên volume sạch đã pass 204/204 local trong 6.8 phút, không retry/failure; nhưng remote CI, preflight provider, production smoke và FCM controlled-device delivery vẫn chưa xác minh, nên release tiếp tục fail closed.

## Xem trước sản phẩm

Ảnh/GIF dưới đây là media lịch sử, không phải ảnh production. Manifest ghi `capturedAt` 2026-07-10 nhưng không có source SHA/image reference, nên không chứng minh current source head hay release candidate. Xem [gallery đầy đủ](product-gallery.vi.md).

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

Admin, Restaurant, Customer và Driver lấy credential realtime ngắn hạn, scope theo tenant từ `POST /api/realtime/token` trong managed mode. Mobile gửi GPS/quyết định dispatch qua REST đã xác thực và chỉ nhận event Supabase outbox nằm trong allowlist; Socket.IO chỉ còn là provider explicit cho local/self-hosted.

## Docker Hub và GitHub Packages

Backend và migrator từng được publish bằng SHA immutable lên Docker Hub và GHCR; đây là candidate lịch sử, không phải bằng chứng cho `master` hiện tại. Admin/Restaurant chưa publish vì env public Supabase bắt buộc còn thiếu, không bake key giả/rỗng vào image.

| Image | Mục đích |
|---|---|
| `nguyenson1710/foodflow-backend` / `ghcr.io/jasontm17/foodflow-backend` | API và worker entry; digest `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` |
| `nguyenson1710/foodflow-migrate` / `ghcr.io/jasontm17/foodflow-migrate` | Prisma migration non-root; digest `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` |
| Admin / Restaurant | Production env đã dùng Supabase publishable key; chờ Railway API live và redeploy/smoke |

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
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
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

Hardening ngày 13/07/2026 đã pass Backend 138 suite / 1016 test cùng Prisma validate/generate, typecheck/lint/build; Admin 195 và Restaurant 134 unit test cùng typecheck/lint/production build. Docker E2E isolated current-source trên volume sạch pass Chromium 68/68, Firefox 68/68, Pixel 5 68/68 (204/204 trong 6.8 phút, không retry/failure), gồm accessibility, auth/refresh/RBAC, customer order qua API, hội tụ trạng thái REST, tenant isolation, map, visual structure, responsive navigation và Restaurant form-login/reload persistence. Migrator/DB báo 33 migration completed, không pending; seed tạo 50 restaurant, 50 driver, 100 customer và 500 historical order; worker khởi động sau seed và index 402 RAG document. Không có DeepSeek key nên embedding pending, không sinh vector giả. Repository track 33 migration và Supabase production lần cuối khớp checksum tại 33 migration đó; volume Docker lịch sử có 34 dòng applied cùng một dòng rolled back không phải migration fresh. Image local `revision=local` không phải artifact immutable. Flutter analyze và các GPS test đã ghi là local evidence có giới hạn. FCM gửi thật và production smoke Railway/Supabase đã xác thực vẫn chưa được thực hiện.

## Thứ tự deploy

1. Khôi phục GitHub Actions và lấy remote checks xanh.
2. Rotate key bị lộ; pass Supabase/Vercel preflight.
3. Deploy Supabase migration, RLS, Realtime publication/channel và Storage policy.
4. Deploy Railway migrator, rồi API/worker; xác minh health/readiness/Cron.
5. Deploy Admin/Restaurant với API URL và Supabase public env đã xác minh.
6. Smoke auth, tenant, realtime, bản đồ/route shipper, chatbot, notification, export, payment.
7. Không tạo/push lại branch integration lịch sử. Chỉ reconcile local `master` đã verify với `origin/master` khi release gate cho phép.
8. Publish Docker immutable rồi mới promote `latest`.

## Tài liệu

- [Kiến trúc](system-architecture.md)
- [Tổng quan và yêu cầu sản phẩm](project-overview-pdr.vi.md)
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

Remote chỉ có `master`. Không còn local ref integration/finalization lịch sử hoặc linked integration worktree. Branch equivalence không phải release approval; không tạo lại, raw-merge hoặc push branch integration lịch sử theo tên.

## License

[MIT](../LICENSE)
