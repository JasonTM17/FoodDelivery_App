# FoodFlow - Nền tảng giao đồ ăn realtime

Ngôn ngữ tài liệu: [English](../README.md) | [Tiếng Việt](readme.vi.md) | [日本語](readme.ja.md)

FoodFlow là nền tảng giao đồ ăn đa ứng dụng gồm backend NestJS, dashboard Admin/Restaurant bằng Next.js, app mobile Flutter, PostgreSQL/PostGIS, Redis, Socket.IO, SePay, Google/OSRM routing và chatbot AI.

FoodFlow không dùng workflow automation runner bên ngoài trong runtime. Chatbot và gợi ý món ăn đi qua backend LLM adapter, trả degraded state rõ ràng khi provider không khả dụng.

## Xem trước sản phẩm

Ảnh chụp thật từ bản Vercel production + API seed. Gallery đầy đủ: **[product-gallery.md](./product-gallery.md)**.

<p align="center">
  <img src="./screenshots/admin/01-login.png" alt="Đăng nhập Admin" width="48%" />
  <img src="./screenshots/restaurant/01-login.png" alt="Đăng nhập Nhà hàng" width="48%" />
</p>

<p align="center">
  <img src="./screenshots/admin/05-users.png" alt="Danh sách người dùng Admin" width="48%" />
  <img src="./screenshots/restaurant/04-menu.png" alt="Thực đơn nhà hàng" width="48%" />
</p>

| App | URL công khai |
|-----|----------------|
| Admin | https://food-delivery-app-one-liard.vercel.app/vi/login |
| Restaurant | https://foodflow-restaurant.vercel.app/vi/login |

API Nest **không** chạy trên Vercel — xem [deployment-guide.md](./deployment-guide.md).

## Ứng dụng

| Bề mặt | Đường dẫn | Runtime | URL mặc định |
|---|---|---|---|
| Backend API | `backend/` | NestJS, Prisma, Socket.IO | `http://localhost:3001/api` |
| Admin dashboard | `web/apps/admin/` | Next.js 14, React 18, next-intl | `http://localhost:3000` |
| Restaurant dashboard | `web/apps/restaurant/` | Next.js 14, React 18, next-intl | `http://localhost:3002` |
| App khách hàng/tài xế | `mobile/` | Flutter | Thiết bị/emulator |
| Hạ tầng | `infra/`, `docker-compose*.yml` | PostgreSQL/PostGIS, Redis, MinIO | Container local |

## Năng lực chính

- Đặt món, ví/COD/SePay, tracking realtime, chatbot hỗ trợ.
- Tài xế online/offline, GPS, dispatch, điều hướng, thu nhập.
- Nhà hàng xử lý đơn, menu, category, review, doanh thu, promotion, nhân sự, insight.
- Admin quản lý KPI, bản đồ tài xế, nhà hàng, người dùng, đơn hàng, promotion, support, audit, export, settings.
- Web contract: success `{ success: true, data, meta? }`; lỗi theo RFC 7807.
- Web route chuẩn: `/:locale/...` với `vi`, `en`, `ja`.

## Chạy local

```bash
docker compose up -d postgres redis minio

cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev

cd ../web
pnpm install --frozen-lockfile
pnpm dev

cd ../mobile
flutter pub get
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

## Secret và bảo mật

- Không commit `.env`, token, private key, database credential hoặc service-role key.
- Key đã paste vào chat/log/screenshot/ticket/git history phải rotate trước production.
- `DATABASE_URL`, `DIRECT_URL`, `DEEPSEEK_API_KEY`, `SEPAY_API_KEY`, `SEPAY_WEBHOOK_SECRET`, JWT secret, Supabase/Vercel tokens phải nằm trong secret manager hoặc file ignored.
- Google Maps browser key phải restrict bằng HTTP referrer; backend Maps key chỉ dùng server-side.
- SePay intent cần `SEPAY_API_KEY` và `SEPAY_ACCOUNT_NUMBER`; response thiếu QR/ref bị reject.

## Gate kiểm thử

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build

cd ../web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox

cd ../mobile
flutter analyze
flutter test
```

Batch 4 chỉ được coi là xong khi backend, web, Playwright Chromium/Firefox, axe, visual regression, tenant isolation, frozen install và secret scan đều xanh.

## Deploy

1. Merge qua PR đã test.
2. Provision Supabase database/realtime bằng secret đã rotate; backend Prisma dùng pooled `DATABASE_URL` khi runtime và direct/session `DIRECT_URL` cho migration.
3. Deploy Admin/Restaurant lên Vercel sau khi build và E2E pass.
4. Deploy backend với migration, Redis, storage, SePay webhook, CORS production và health checks.
5. Xác minh production health, realtime, map, chatbot, export, notification và tenant isolation.
6. Chỉ bật keep-alive/monitor sau khi health endpoint ổn định.

## Tài liệu

- [API contract](api-contract.md)
- [API reference](api-reference.md)
- [Architecture](system-architecture.md)
- [Deployment guide](deployment-guide.md)
- [Hướng dẫn Docker/local dev](docker-local-dev-guide.vi.md)
- [Testing guide](testing-guide.md)
- [Security audit guide](security-audit-guide.vi.md)
- [Documentation localization policy](documentation-localization.md)
- [Design guidelines](design-guidelines.vi.md)
- [i18n guide](i18n-guide.md)
- [Roadmap](project-roadmap.md)

## Chính sách branch

- Remote hiện chỉ còn `master`; audit ngày 2026-07-06 ghi nhận `origin/master` tại `64e46c795c9c15ae52bb0112f91e93a6f3851645`.
- Worktree sạch có thể vẫn dùng local branch `codex/batch4-integration` để giữ ngữ cảnh Codex, nhưng branch này tracking `origin/master`; không tạo lại remote branch đã xoá nếu không chủ ý mở review branch.
- Không raw-merge branch cũ kéo routes cũ, mock runtime, package manager sai hoặc generated mobile client sai contract.
- Salvage theo từng hunk, có focused test và conventional commit nhỏ.
- Tiếp tục mobile reconciliation sau khi web/backend Batch 4 ổn định; nếu không có ref Violet/Indigo thì ghi evidence thay vì tạo merge giả.

## License

MIT, xem [LICENSE](../LICENSE).
