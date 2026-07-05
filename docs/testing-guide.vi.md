# Hướng dẫn kiểm thử FoodFlow

Ngôn ngữ: [English](testing-guide.md) | [Tiếng Việt](testing-guide.vi.md) | [日本語](testing-guide.ja.md)

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

CI có thể đặt `AI_ALLOW_DEGRADED=true` khi chưa có secret LLM provider; gate vẫn kiểm auth, tool grounding, order lookup theo tenant, support-ticket escalation và hallucination guard. Release verification phải chạy không degraded mode và dùng `DEEPSEEK_API_KEY` hợp lệ/đã rotate từ secret manager.

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
Evidence map/tracking trước đó: 2026-07-04 tại `3252c6a`, backend `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 test), focused `route-utils.spec.ts` (11 test) và `pnpm build` đều pass. Admin driver map realtime pass `pnpm --filter foodflow-admin test` (34 files / 139 test), `pnpm --filter foodflow-admin typecheck`, `pnpm --filter foodflow-admin lint`, web `pnpm install --frozen-lockfile` và `pnpm --filter foodflow-admin build`. Evidence bổ sung 2026-07-05 xác minh customer mobile hydrate snapshot REST `/orders/:id/tracking` trước realtime, tôn trọng `routePhase`, xoá route geometry stale khi snapshot không có route, từ chối GPS shipper invalid, không trả estimated minutes persisted khi chưa có route cache thật, và pass `flutter analyze`, full `flutter test` (166 test), backend tracking suite (5 suite / 41 test), focused dispatch/tracking regressions (2 suite / 16 test), web typecheck, OpenAPI/Spectral checks.
Evidence Restaurant web current-head mới nhất: 2026-07-04 tại `2cd87e5`, `pnpm --filter restaurant typecheck`, `pnpm --filter restaurant lint`, `pnpm --filter restaurant test` (27 files / 79 test) và `pnpm --filter restaurant build` đều pass. Production build sinh đầy đủ route localized `vi`, `en`, `ja` cùng `/api/healthz`.
Evidence backend/web gate current-head mới nhất: 2026-07-04 sau `ad3b730`, backend `pnpm install --frozen-lockfile`, `pnpm prisma generate`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 test) và `pnpm build` đều pass. Web workspace `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 34 files / 139 test; Restaurant 27 files / 79 test) và `pnpm build` đều pass. Admin build sinh 70 page localized và Restaurant build sinh 55 page localized cho `vi`, `en`, `ja`. Evidence remote CI/Actions cho head này vẫn pending vì token/auth tài khoản đang chưa hợp lệ.

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

Evidence E2E local mới nhất: 2026-07-05, Docker Compose có Backend/Admin/Restaurant standalone containers healthy với `NEXT_PUBLIC_API_URL` được truyền lúc build image. Vì máy local có process khác đang chiếm `127.0.0.1:3000`, lần verify dùng endpoint IPv6 loopback rõ ràng: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`. Chromium + Firefox pass 70/70 test, bao phủ axe serious/critical smoke, visual contract, điều hướng admin driver map, tracking endpoint availability, realtime status flows và tenant isolation. Current head `161ce9a` có thêm fix backend route/ETA và gate backend/web/mobile mới; rerun Playwright trước deployment approval.

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
Evidence mobile local mới nhất: 2026-07-05 trên `codex/batch4-integration`, `flutter pub get --enforce-lockfile` pass, `flutter analyze` không có issue, toàn bộ `flutter test` pass 166 test và `dart analyze mobile/packages/api_client` không có issue. Android flavor debug APK build pass cho `flutter build apk --debug --flavor customer -t lib/main_customer.dart` và `flutter build apk --debug --flavor driver -t lib/main_driver.dart`, với package ID và launcher label riêng cho customer/driver. Native Google Maps key chỉ lấy từ env/local xcconfig, còn Android release signing fail-closed cho tới khi có đủ secret `FOODFLOW_UPLOAD_*`. Backend route integrity gates cũng pass local cho cùng cụm map/tracking: `pnpm typecheck`, `pnpm lint`, `pnpm build`, backend tracking suite (5 suite / 41 test) và focused dispatch/tracking regressions (2 suite / 16 test).

Remote CI xanh đầy đủ gần nhất ở `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252` và Integration Smoke Gate `28704171294`. Các head sau đó, gồm những commit local Batch 4 mới nhất, chưa thể start hoặc hoàn tất remote jobs vì GitHub Actions báo blocker billing/spending-limit hoặc token/auth. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests và Integration Smoke Gate sau khi billing/auth được xử lý.

## Evidence local mới nhất (2026-07-05)

Runtime code head: `161ce9a` trên `master`. Remote `codex/batch4-integration` đã xoá trước đó sau khi xác minh patch-equivalence tại `3857433`; worktree sạch local có thể vẫn dùng branch `codex/batch4-integration`, nhưng branch này tracking `origin/master`. Remote CI/Actions vẫn pending vì token/auth/billing GitHub chưa khả dụng.

- Frozen install pass cho backend và web với `pnpm 11.7.0`; mobile `flutter pub get --enforce-lockfile` pass.
- Backend pass `pnpm typecheck`, `pnpm lint`, full `pnpm test` (107 suite / 760 test) và `pnpm build`; focused dispatch/order-code regressions pass 3 suite / 46 test, route/ETA regressions mới nhất pass 2 suite / 16 test.
- Web pass `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 35 file / 144 test; Restaurant 28 file / 83 test) và `pnpm build` (Admin 70 page localized; Restaurant 55 page localized).
- Docker Compose rebuild image Backend/Admin/Restaurant từ source hiện tại với frozen install; health check pass cho `http://[::1]:3001/api/healthz`, `http://[::1]:3000/api/healthz`, `http://[::1]:3002/api/healthz`.
- Playwright pass Chromium + Firefox cùng lúc: 70/70 test với IPv6 loopback URL. Coverage gồm axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows và tenant isolation.
- Mobile pass `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` (166 test), `dart analyze mobile/packages/api_client` và Android debug APK build cho cả customer/driver flavor. APK build chỉ có warning tương thích tương lai từ `share_plus` áp dụng Kotlin Gradle Plugin, không làm fail.
- Tracking contract refresh pass backend `pnpm exec jest src/tracking --runInBand` (5 suite / 41 test) và focused dispatch/tracking regression tests (2 suite / 16 test). OpenAPI YAML parse trước đó pass 137 path với `OrderTrackingResponse.routePhase` required.
- Dispatch/map evidence: restaurant acceptance hiện enqueue route-aware dispatch jobs có restaurant latitude/longitude và attempt metadata; worker bỏ qua legacy malformed jobs, parse đúng ioredis `GEOSEARCH WITHDIST` tuple rows và không còn fail `raw[i].replace is not a function`. Event customer `driver:assigned` hiện trả `etaMinutes: null` để backend không tự bịa ETA theo vận tốc trước khi tracking có route Google/OSRM thật.
- Security evidence: high-confidence tracked secret scan không có match. Không có tracked dotenv/key/credential file ngoài `.env.example`. Native Firebase/provisioning artifacts đã được ignore. Legacy fake refund processor đã xoá; refund hiện enqueue `payment-refund` và full refund chỉ đánh dấu sau khi SePay hoặc wallet ledger reversal thành công. Mobile idempotency key là UUID v4, HTTP body log mobile chỉ bật trong debug và đã redact.

## Security checks

```bash
git diff --check
git diff --cached --check
```

Chạy staged và tracked-file secret scan. Placeholder trong `.env.example` được phép, nhưng token thật, private key, database credential và service-role secret phải bị block.
