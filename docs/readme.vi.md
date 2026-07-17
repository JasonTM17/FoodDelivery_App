# FoodFlow — Nền tảng vận hành giao đồ ăn

Ngôn ngữ: [English](../README.md) · **Tiếng Việt** · [日本語](readme.ja.md)

FoodFlow là hệ thống giao đồ ăn multi-tenant gồm API NestJS, web Admin/Restaurant và ứng dụng Flutter Customer/Driver. Kiến trúc production dùng Supabase (PostgreSQL/PostGIS, Realtime, Storage), Railway (API, worker, migrator, Redis) và Vercel (Admin, Restaurant). Docker Compose giữ một profile tương thích riêng cho local/self-hosted bằng Socket.IO, Redis/BullMQ và MinIO.

> **Ảnh chụp khôi phục 17/07/2026:** Railway đã healthy lại ở SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` sau khi xoay credential Supabase và deploy đủ sáu URL database; health/readiness và audit migration 42/42 đều pass. Admin và Restaurant đều trả HTTP 200 nhưng revision bị tách ở `e6def517…` và `977d55f…`, vì vậy chưa được coi là một release thống nhất. Release chỉ hợp lệ khi SHA của tag trùng `origin/master`, Railway API và cả hai health endpoint Vercel. Thiết bị vật lý Android/iOS, FCM kiểm soát, active-order và provider tùy chọn vẫn nằm ngoài chứng nhận nếu chưa có evidence riêng.

## Xem trước sản phẩm

FoodFlow có bốn bề mặt sản phẩm. Chọn [hướng dẫn Admin](admin-guide.vi.md), [Restaurant](restaurant-guide.vi.md), [Khách hàng](customer-guide.vi.md) hoặc [Tài xế](driver-guide.vi.md), rồi xem [gallery đầy đủ](product-gallery.vi.md) và [tổng quan mobile](customer-driver-guide.vi.md). Manifest ghi source head, runtime, thời gian, ranh giới riêng tư và SHA-256 của toàn bộ asset. Phần lớn media web được capture bằng Google Chrome trên E2E stack local cô lập; hai ảnh Admin/Restaurant được gắn nhãn riêng là evidence production có kiểm soát lịch sử của SHA `17584153`. Media mobile dùng Flutter debug APK trên Android API 35 x86_64 AVD; một ảnh recovery Driver được gắn nhãn riêng là evidence production-emulator có phạm vi. Không asset nào chứng nhận thiết bị vật lý hay app-store.

| Bề mặt     | Runtime                               | Bằng chứng trực quan hiện có              | Cách xem sản phẩm                                                                                       |
| ---------- | ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Admin      | Dashboard web Next.js                 | 10 PNG local, một GIF và một PNG production lịch sử | Đọc [hướng dẫn Admin](admin-guide.vi.md), rồi chạy Admin web.                              |
| Restaurant | Dashboard web Next.js                 | 10 PNG local, một GIF và một PNG production lịch sử | Đọc [hướng dẫn Restaurant](restaurant-guide.vi.md), rồi chạy Restaurant web.               |
| Customer   | Ứng dụng Flutter/Riverpod Android/iOS | Chín WebP local và hai GIF đã kiểm duyệt riêng tư | Đọc [hướng dẫn Khách hàng](customer-guide.vi.md), rồi chạy `main_customer.dart` trên thiết bị/emulator. |
| Driver     | Ứng dụng Flutter/Riverpod Android/iOS | Bảy WebP local, một WebP production-emulator, hai asset tracking và một GIF | Đọc [hướng dẫn Tài xế](driver-guide.vi.md), rồi chạy `main_driver.dart`.             |

Manifest tách rõ capture local, production lịch sử và production-emulator có phạm vi. Muốn có bằng chứng release phải capture lại từ clean head trên thiết bị/emulator của release candidate; không gắn bất kỳ evidence có phạm vi nào thành chứng nhận production đầy đủ.

<p align="center">
  <img src="screenshots/admin/02-overview.png" alt="Tổng quan Admin FoodFlow" width="48%" />
  <img src="screenshots/restaurant/04-menu.png" alt="Thực đơn Restaurant FoodFlow" width="48%" />
</p>

| Luồng | Xem trước |
|---|---|
| Đăng nhập Admin → tổng quan | ![Luồng Admin](media/gifs/admin-login-flow.gif) |
| Đơn hàng Restaurant → thực đơn | ![Luồng Restaurant](media/gifs/restaurant-orders-to-menu.gif) |
| Customer đăng nhập → đăng ký → đăng nhập | ![Luồng xác thực Customer](media/gifs/customer-auth-flow.gif) |
| Driver đăng nhập → Trang chủ → Thu nhập → Hồ sơ | ![Luồng Driver](media/gifs/driver-role-flow.gif) |

## Các ứng dụng

| Bề mặt     | Mã nguồn                                                 | Runtime                                               | URL local                                    | Hướng dẫn chính                                          |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| API        | `backend/`                                               | NestJS 11, Prisma 6                                   | `http://localhost:3001/api`                  | —                                                        |
| Admin      | `web/apps/admin/`                                        | Next.js 15, React 18                                  | `http://localhost:3000`                      | [Hướng dẫn Admin](admin-guide.vi.md)                    |
| Restaurant | `web/apps/restaurant/`                                   | Next.js 15, React 18                                  | `http://localhost:3002`                      | [Hướng dẫn Restaurant](restaurant-guide.vi.md)          |
| Customer   | [`main_customer.dart`](../mobile/lib/main_customer.dart) | Ứng dụng mobile Flutter/Riverpod native (Android/iOS) | thiết bị/emulator; Android flavor `customer` | [Hướng dẫn Khách hàng](customer-guide.vi.md)             |
| Driver     | [`main_driver.dart`](../mobile/lib/main_driver.dart)     | Ứng dụng mobile Flutter/Riverpod native (Android/iOS) | thiết bị/emulator; Android flavor `driver`   | [Hướng dẫn Tài xế](driver-guide.vi.md)                  |

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

Google Maps không bắt buộc để hệ thống khởi động. Nếu không cấu hình Google Directions hoặc OSRM do dự án sở hữu, tính route trả `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` nhưng API/worker vẫn healthy. Railway hiện đặt `RAG_ENABLED=false` vì chưa có credential DeepSeek.

## Kiến trúc provider

| Thành phần  | Managed production                 | Local/self-hosted                |
| ----------- | ---------------------------------- | -------------------------------- |
| Database    | Supabase PostgreSQL/PostGIS        | PostGIS container                |
| Realtime    | `REALTIME_PROVIDER=supabase`       | `socketio`                       |
| Storage     | `STORAGE_PROVIDER=supabase`        | `minio`                          |
| Queue       | `QUEUE_PROVIDER=supabase-postgres` | `bullmq`                         |
| Basemap web | MapLibre + OpenFreeMap             | Cùng provider hoặc style tự host |

Admin, Restaurant, Customer và Driver lấy credential realtime ngắn hạn, scope theo tenant từ `POST /api/realtime/token` trong managed mode. Mobile gửi GPS/quyết định dispatch qua REST đã xác thực và nhận private Supabase Broadcast do server gửi tới các kênh mà JWT cho phép; Socket.IO chỉ còn là provider explicit cho local/self-hosted.

## Docker immutable — SHA 84eeac3

Docker Publish run `29515529360` đã build, runtime-smoke, scan High/Critical và publish các manifest SHA immutable cho AMD64/ARM64. Alias `latest` và semver chưa đổi.

| Artifact | Digest Docker Hub |
| --- | --- |
| `foodflow-backend` | `sha256:09bae57f907fc6d13c9874a673a8d73397510e3d50f75b6f20415e948285c24e` |
| `foodflow-migrate` | `sha256:04a089f17269d8ceb94f3f55cb241c91e0eb16db68ffaae4067c8f9a7bbbe16d` |
| `foodflow-admin` | `sha256:1f75f3fd4cd6b9cc4b0814efee3aab79643f5f9ce6962cabd1505ef57c4992db` |
| `foodflow-restaurant` | `sha256:d92f6b8baaccc0a7ae8f83a22bff4d5d949fa07f6242fa456616465b44059316` |

Worker chạy từ backend image với `dist/workers/main.js`, không phải artifact release riêng. Lịch sử candidate cũ được giữ trong [release report](batch4-release-report.md), không dùng làm nguồn cho rollout mới.

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

# Terminal A: Admin
cd ../web
corepack pnpm install --frozen-lockfile
corepack pnpm --filter foodflow-admin dev --port 3000

# Terminal B: Restaurant (từ thư mục gốc repo sau khi install)
cd web
corepack pnpm --filter restaurant dev --port 3002

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

Lần chạy Docker volume sạch ngày 14/07/2026 của project `foodflow-batch4-e2e` đã apply 36 migration hiện hành lúc chạy, seed 201 user, 50 restaurant, 352 menu item, 509 order và 123 review, rồi index 402 RAG document. Ma trận Playwright pass 204/204 trong 353 giây. Sau khi thêm migration 37–38 và các fix mobile, database tạm mới apply đủ 38 migration và từ chối default address thứ hai; `flutter analyze` vẫn sạch và toàn bộ suite Customer/Driver pass 369 test. Vẫn phải chạy lại full Docker/Playwright trên clean head cuối. Bằng chứng local không xác minh provider từ xa, image đã deploy hay Firebase live.

## Thứ tự deploy

1. Rotate key bị lộ và giữ mọi giá trị Railway/provider đã cấu hình trong secret store.
2. Khôi phục/review provenance checksum Storage còn lại, yêu cầu audit checksum pass, rồi backup trước mọi rollout migration tiếp theo qua môi trường production đã duyệt. Không suy luận provenance từ schema end-state/Docker local hoặc dùng `prisma migrate resolve` để che blocker.
3. Giữ hai deployment Railway đã verify; lần release sau deploy API/worker từ cùng một SHA immutable rồi kiểm lại health/readiness/worker polling.
4. Smoke Supabase Broadcast private allow/deny, token refresh, Storage, GPS snapshot/delta/reconnect và tenant isolation qua API live.
5. Smoke lại đúng deployment Vercel Admin/Restaurant với API Railway hiện tại, rồi kiểm map/route đã cấu hình, chatbot, notification, export, payment và FCM thiết bị kiểm soát.
6. Nối hai package GHCR Admin/Restaurant với repository, cấp workflow write, rồi publish/pull/scan bốn image SHA immutable.
7. Chỉ promote `latest` sau khi production smoke xanh.

## Tài liệu

- [Hướng dẫn Admin](admin-guide.vi.md) — vận hành nền tảng, support, report, export và settings
- [Hướng dẫn Restaurant](restaurant-guide.vi.md) — đơn hàng, menu, quyền staff, revenue và settings
- [Hướng dẫn Khách hàng](customer-guide.vi.md) — đặt món, quyền, chọn địa chỉ trên bản đồ, checkout, tracking và hỗ trợ
- [Hướng dẫn Tài xế](driver-guide.vi.md) — onboarding, Online/GPS, dispatch, thu nhập và hồ sơ
- [Gallery sản phẩm](product-gallery.vi.md) và [tổng quan mobile](customer-driver-guide.vi.md)
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
