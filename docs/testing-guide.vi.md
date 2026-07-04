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
Evidence backend current-head mới nhất: 2026-07-04 tại `7916ea3`, `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 750 test) và `pnpm build` đều pass.

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

Evidence E2E local mới nhất: 2026-07-04 trên `codex/batch4-integration`, Docker Compose build Admin/Restaurant standalone containers healthy với `NEXT_PUBLIC_API_URL` được truyền lúc build image. Vì máy local có process khác đang chiếm `127.0.0.1:3000`, lần verify dùng endpoint IPv6 loopback rõ ràng: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`, sau đó `pnpm test:e2e --project=chromium --project=firefox` pass 70/70 test, gồm axe serious/critical smoke, visual contract và tenant isolation.

Batch 4 E2E cần bao phủ login/RBAC, locale routes, WebSocket order feed, promotion CRUD, support flow, exports, menu, revenue, staff, insights, notifications và tenant isolation. Spec `web/e2e/tests/tenant-isolation.spec.ts` phải chứng minh user nhà hàng không thể list, đọc hoặc update order thuộc tenant nhà hàng khác.

Regression bảo mật realtime cũng phải kiểm tra:

- Socket.IO không cho kết nối khi thiếu token, dùng refresh token, token hết hạn hoặc chữ ký sai.
- User không phải admin không thể join phòng đơn hàng hoặc tài xế của Admin.
- Nhà hàng không thể join phòng của tenant khác.
- Khách hàng, tài xế và nhân viên nhà hàng không thể join phòng đơn hàng không liên quan.
- Chỉ tài khoản driver đã xác thực mới được gửi cập nhật GPS.
- Mobile normalize GPS metadata của driver trước khi publish: speed từ Geolocator được đổi từ m/s sang km/h theo contract backend, và heading/speed/accuracy invalid bị bỏ.
- Map driver/customer phải vẽ `routePolyline` từ backend tách riêng khỏi raw telemetry trail.
- Route geometry bị clear khi đơn hàng đổi từ pickup phase sang dropoff phase để client không vẽ nhầm tuyến cũ đến nhà hàng sau khi đã pickup.
- Nếu Google/OSRM route provider không khả dụng, tracking trả `etaMinutes: null` và `source: route_unavailable`; backend không được tự bịa ETA đường thẳng.
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
flutter analyze
flutter test
```

Mobile API client phải dùng Batch 4 OpenAPI contract đã ổn định.
Gate mobile Batch 4 hiện yêu cầu `flutter analyze` không có issue và toàn bộ Flutter test suite pass.
Evidence mobile local mới nhất: 2026-07-04 trên `codex/batch4-integration` sau fix clear stale route, `dart format --set-exit-if-changed` không đổi file, focused route tests pass (`tracking_provider_test.dart`, `encoded_polyline_test.dart`, `trip_route_provider_test.dart`), `flutter analyze` không có issue và toàn bộ `flutter test` pass 136 test. Backend route integrity gates cũng đã chạy local trước commit mobile-only GPS metadata: `pnpm typecheck`, `pnpm lint`, `pnpm test` (106 suites, 747 test) và `pnpm build` đều pass.

Remote CI xanh đầy đủ gần nhất ở `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252` và Integration Smoke Gate `28704171294`. Các head sau đó, gồm những commit local Batch 4 mới nhất, chưa thể start hoặc hoàn tất remote jobs vì GitHub Actions báo blocker billing/spending-limit hoặc token/auth. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests và Integration Smoke Gate sau khi billing/auth được xử lý.

## Security checks

```bash
git diff --check
git diff --cached --check
```

Chạy staged và tracked-file secret scan. Placeholder trong `.env.example` được phép, nhưng token thật, private key, database credential và service-role secret phải bị block.
