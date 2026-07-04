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

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

Batch 4 E2E cần bao phủ login/RBAC, locale routes, WebSocket order feed, promotion CRUD, support flow, exports, menu, revenue, staff, insights, notifications và tenant isolation. Spec `web/e2e/tests/tenant-isolation.spec.ts` phải chứng minh user nhà hàng không thể list, đọc hoặc update order thuộc tenant nhà hàng khác.

Regression bảo mật realtime cũng phải kiểm tra:

- Socket.IO không cho kết nối khi thiếu token, dùng refresh token, token hết hạn hoặc chữ ký sai.
- User không phải admin không thể join phòng đơn hàng hoặc tài xế của Admin.
- Nhà hàng không thể join phòng của tenant khác.
- Khách hàng, tài xế và nhân viên nhà hàng không thể join phòng đơn hàng không liên quan.
- Chỉ tài khoản driver đã xác thực mới được gửi cập nhật GPS.
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
Evidence local mới nhất: 2026-07-04 trên `codex/batch4-integration`, `flutter analyze` không có issue và `flutter test` pass 122 test.

## Security checks

```bash
git diff --check
git diff --cached --check
```

Chạy staged và tracked-file secret scan. Placeholder trong `.env.example` được phép, nhưng token thật, private key, database credential và service-role secret phải bị block.
