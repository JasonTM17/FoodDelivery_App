# Hướng dẫn kiểm thử FoodFlow

Ngôn ngữ: [English](testing-guide.md) | [Tiếng Việt](testing-guide.vi.md) | [日本語](testing-guide.ja.md)

## Bằng chứng local mới nhất (2026-07-10)

Overlay E2E cô lập đã áp dụng thành công 22/22 Prisma migration từ database trắng. Backend pass 121 suite / 891 test; Admin 44 file / 183 test; Restaurant 35 file / 118 test; web typecheck/lint/build và mobile 255/255 Flutter test đều xanh. Playwright Chromium + Firefox pass 72/72. Axe smoke pass 4/4 (Admin + Restaurant trên cả hai browser), serious/critical = 0; visual contract và tenant isolation cũng xanh. AI local kiểm tra fail-closed `AI_PROVIDER_NOT_CONFIGURED`; live DeepSeek smoke chỉ chạy khi `DEEPSEEK_API_KEY` mới đã rotate và được nhập qua secret manager. Vercel/Supabase production vẫn blocked bởi env/token còn thiếu.

## Backend

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Ví dụ focused:

```bash
pnpm test -- sepay.provider.spec.ts payments.service.spec.ts
pnpm test -- ai-chat.service.spec.ts deepseek-chat-provider.service.spec.ts ai-chat.controller.spec.ts
pnpm test -- restaurant-revenue.service.spec.ts
```

Backend tests phải chứng minh behavior thật: không mock payment runtime, không AI answer giả, không business value random, và query phải tenant-scoped.

Ngưỡng coverage backend được cấu hình trong `backend/jest.config.ts`; không truyền JSON threshold qua CLI vì quoting khác nhau giữa shell.

### AI scenario smoke gate

`pnpm db:big-seed` tạo các đơn AI smoke deterministic `FF-001`, `FF-002`, `FF-003`, `FF-004`, `FF-006`, `FF-007`, `FF-008`, `FF-009` và `FF-010` cho `customer1@foodflow.vn`. Workflow integration đăng nhập qua `/api/auth/login` rồi chạy `e2e/ai-scenarios/run-ai-scenarios.ts` trên endpoint `/api/ai/chat` có auth.

CI chỉ được mock provider adapter trong unit test xác định; không được bật runtime degraded answer path. Release verification phải chạy smoke live-provider đã xác thực với `DEEPSEEK_API_KEY` hợp lệ/đã rotate từ secret manager và xác minh telemetry đã persist.

## Web

```bash
cd web
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused dashboard checks:

```bash
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build

pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
```

Evidence web/API-contract local mới nhất: 2026-07-04 trên `codex/batch4-integration`, OpenAPI YAML parse pass với 137 path và scanner coverage endpoint web local báo `MISSING_ENDPOINTS=0`. `pnpm typecheck`, `pnpm lint`, `pnpm test` và `pnpm build` pass cho toàn bộ web workspace; Vitest pass Admin 34 files / 137 test và Restaurant 27 files / 79 test. Backend cho cụm contract này pass `pnpm typecheck`, `pnpm lint` và Jest target (`admin-resources.service.spec.ts`, `admin.heatmap.spec.ts`: 2 suite / 9 test).
Evidence map/tracking trước đó tại `3252c6a` vẫn là lịch sử hữu ích, nhưng ma trận verify current-head là evidence 2026-07-06 trong [Batch 4 release report](batch4-release-report.md).
Evidence Restaurant web current-head mới nhất: 2026-07-04 tại `2cd87e5`, `pnpm --filter restaurant typecheck`, `pnpm --filter restaurant lint`, `pnpm --filter restaurant test` (27 files / 79 test) và `pnpm --filter restaurant build` đều pass. Production build sinh đầy đủ route localized `vi`, `en`, `ja` cùng `/api/healthz`.
Evidence backend/web gate current-head mới nhất: 2026-07-04 sau `ad3b730`, backend `pnpm install --frozen-lockfile`, `pnpm prisma generate`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 test) và `pnpm build` đều pass. Web workspace `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 34 files / 139 test; Restaurant 27 files / 79 test) và `pnpm build` đều pass. Admin build sinh 70 page localized và Restaurant build sinh 55 page localized cho `vi`, `en`, `ja`. Evidence remote CI/Actions cho head này vẫn pending vì token/auth tài khoản đang chưa hợp lệ.

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

Evidence E2E local mới nhất: 2026-07-06 tại `33e90ea`, Docker Compose rebuild Backend/Admin/Restaurant standalone containers healthy với `NEXT_PUBLIC_API_URL` được truyền lúc build image. Vì máy local có process khác đang chiếm `127.0.0.1:3000`, lần verify dùng endpoint IPv6 loopback rõ ràng: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`. Chromium + Firefox pass 70/70 test, bao phủ axe serious/critical smoke, visual contract, điều hướng admin driver map, tracking endpoint availability, realtime status flows và tenant isolation. Harness E2E hiện fail-fast nếu route local trả về Next.js 404 shell.

Batch 4 E2E cần bao phủ login/RBAC, locale routes, WebSocket order feed, promotion CRUD, support flow, exports, menu, revenue, staff, insights, notifications và tenant isolation. Spec `web/e2e/tests/tenant-isolation.spec.ts` phải chứng minh user nhà hàng không thể list, đọc hoặc update order thuộc tenant nhà hàng khác.

Regression bảo mật realtime cũng phải kiểm tra:

- Socket.IO không cho kết nối khi thiếu token, dùng refresh token, token hết hạn hoặc chữ ký sai.
- User không phải admin không thể join phòng đơn hàng hoặc tài xế của Admin.
- Nhà hàng không thể join phòng của tenant khác.
- Khách hàng, tài xế và nhân viên nhà hàng không thể join phòng đơn hàng không liên quan.
- Chỉ tài khoản driver đã xác thực mới được gửi cập nhật GPS.
- Mobile normalize GPS metadata của driver trước khi publish: speed từ Geolocator được đổi từ m/s sang km/h theo contract backend, và heading/speed/accuracy invalid bị bỏ.
- Map driver/customer phải vẽ `routePolyline` từ backend tách riêng khỏi raw telemetry trail.
- Kiểm tra lệch tuyến phải snap vào các đoạn polyline nối liền, không chỉ các vertex, để route provider trả polyline thưa không làm tài xế bị đánh dấu lệch tuyến sai.
- Route geometry bị clear khi đơn hàng đổi từ pickup phase sang dropoff phase để client không vẽ nhầm tuyến cũ đến nhà hàng sau khi đã pickup.
- Nếu Google/OSRM route provider không khả dụng, tracking trả `etaMinutes: null` và `source: route_unavailable`; backend không được tự bịa ETA đường thẳng.
- Admin driver map phải xoá `currentOrder` cũ khi realtime gửi `orderId: null` và bỏ qua tọa độ realtime invalid trước khi đưa vào Google Maps.
- Mobile driver “Mở chỉ đường” phải truyền tọa độ tài xế hiện tại làm Google Maps `origin` khi có, dùng navigation mode, và hiển thị trạng thái không khả dụng rõ ràng khi destination invalid.
- Mobile driver route replay và demand heatmap phải render bằng Google Maps overlays thật từ route/demand coordinates của backend; không thay bằng canvas schematic hoặc điểm local tự sinh.
- Client notification không thể subscribe hoặc sửa dữ liệu dưới danh nghĩa user khác.
- Phòng offer dispatch và thao tác accept/reject phải gắn với driver ID đã xác thực.
- Web Admin và Restaurant gửi access token mới nhất khi reconnect.

## Accessibility và visual QA

- Axe không có serious/critical issue.
- Keyboard navigation, visible focus, dialog focus trap, chart/table alternatives.
- Chạy `web/e2e/tests/visual-contract.spec.ts` cùng Playwright suite. Spec này kiểm Admin và Restaurant login brand shell của FoodFlow, centering responsive, token SVG logo, contrast CTA và lưu screenshot review trong Playwright `test-results`.
- So sánh với Stitch baseline đã duyệt.
- Hiện repo chưa lưu Stitch bitmap baseline đã duyệt; chỉ thêm pixel snapshot `toHaveScreenshot` sau khi Stitch export đã được review và chấp thuận.
- Kiểm desktop 1440/1280, tablet và mobile.

## Mobile

Mobile reconcile sau khi web/backend Batch 4 ổn định.

```bash
cd mobile
flutter pub get
flutter pub get --enforce-lockfile
flutter analyze
flutter test
```

Mobile API client phải dùng Batch 4 OpenAPI contract đã ổn định.
Gate mobile Batch 4 hiện yêu cầu frozen install, `flutter analyze` không có issue, toàn bộ Flutter test suite pass và Android debug APK compile được cho cả entrypoint customer lẫn driver.
Evidence mobile local mới nhất: `flutter pub get --enforce-lockfile` pass, `flutter analyze` không có issue, toàn bộ `flutter test` pass 225 test, focused tracking/driver route/heatmap tests pass 22/22, và `flutter build apk --debug` sinh `build/app/outputs/flutter-apk/app-debug.apk`. APK build chỉ có warning tương thích tương lai từ `share_plus` áp dụng Kotlin Gradle Plugin, không làm fail. Native Google Maps key chỉ lấy từ env/local xcconfig, còn Android release signing fail-closed cho tới khi có đủ secret `FOODFLOW_UPLOAD_*`.

Remote CI xanh đầy đủ gần nhất ở `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252` và Integration Smoke Gate `28704171294`. Các head sau đó, gồm những commit local Batch 4 mới nhất, chưa thể start hoặc hoàn tất remote jobs vì GitHub Actions báo blocker billing/spending-limit hoặc token/auth. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests và Integration Smoke Gate sau khi billing/auth được xử lý.

## Evidence local mới nhất (2026-07-06)

Code head đã verify hiện tại là `33e90ea` trên `origin/master` trước docs-only refresh này. Remote `codex/batch4-integration` đã xoá; worktree sạch local vẫn dùng branch `codex/batch4-integration`, tracking `origin/master`. Remote CI/Actions vẫn pending vì GitHub token/auth/billing chưa khả dụng.

- Frozen install pass cho backend và web với `pnpm 11.7.0`; mobile `flutter pub get --enforce-lockfile` pass.
- Backend pass Prisma validate với test `DATABASE_URL`/`DIRECT_URL`, `pnpm typecheck`, `pnpm lint`, full `pnpm exec jest --runInBand` (110 suite / 802 test) và `pnpm build`.
- Web pass `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 37 file / 153 test; Restaurant 31 file / 100 test) và `pnpm build` (Admin 70 page localized; Restaurant 55 page localized).
- Docker Compose rebuild image Backend/Admin/Restaurant từ source hiện tại với frozen install; health check pass cho `http://[::1]:3001/api/healthz`, `http://[::1]:3000/api/healthz`, `http://[::1]:3002/api/healthz` sau rebuild.
- Playwright pass Chromium + Firefox cùng lúc: 70/70 test với IPv6 loopback URL. Coverage gồm axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows và tenant isolation.
- Mobile pass `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` (225 test), focused tracking/driver route/heatmap tests 22/22, và `flutter build apk --debug`.
- Tracking contract refresh pass backend `pnpm exec jest src/tracking --runInBand` (5 suite / 41 test) và focused dispatch/tracking regression tests (2 suite / 16 test). OpenAPI YAML parse trước đó pass 137 path với `OrderTrackingResponse.routePhase` required.
- Dispatch/map evidence: restaurant acceptance hiện enqueue route-aware dispatch jobs có restaurant latitude/longitude và attempt metadata; worker bỏ qua legacy malformed jobs, parse đúng ioredis `GEOSEARCH WITHDIST` tuple rows và không còn fail `raw[i].replace is not a function`. Event customer `driver:assigned` hiện trả `etaMinutes: null` để backend không tự bịa ETA theo vận tốc trước khi tracking có route Google/OSRM thật.
- Security evidence: high-confidence tracked secret scan không có match. Không có tracked dotenv/key/credential file ngoài `.env.example`. Native Firebase/provisioning artifacts đã được ignore. Legacy fake refund processor đã xoá; refund hiện enqueue `payment-refund` và full refund chỉ đánh dấu sau khi SePay hoặc wallet ledger reversal thành công. Mobile idempotency key là UUID v4, HTTP body log mobile chỉ bật trong debug và đã redact.

## Security checks

```bash
git diff --check
git diff --cached --check
```

Chạy staged và tracked-file secret scan. Placeholder trong `.env.example` được phép, nhưng token thật, private key, database credential và service-role secret phải bị block.
