# Roadmap dự án FoodFlow

Ngôn ngữ: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

Roadmap này phản ánh hướng Batch 4 đã merge trên `master`. Nó tách phần đã landing khỏi phần còn phải test trước production deployment.

## Ưu tiên hiện tại: hardening sau merge và sẵn sàng deploy

Mục tiêu: giữ Admin, Restaurant, backend và mobile khớp Batch 4 contract đã merge, đóng các gap sẵn sàng deploy và rerun remote CI sau khi GitHub Actions auth được khôi phục, đồng thời giữ Next.js 14, React 18, ESLint 8, pnpm 11.7.0 đã pin và constraints Flutter hiện có.

Batch 4 chưa hoàn tất nếu local gates, E2E, accessibility, visual checks, tenant-isolation checks, remote CI/security checks và deployment validation chưa pass.

## Đã landing trên `master`

- `origin/master` đã được recheck local tại `118459e539eecb2dbd61e033431b7f4b5104f0e0`; `git ls-remote --heads origin` hiện chỉ có `master`. Branch local `codex/batch4-integration` vẫn dùng cho worktree continuity và tracking `origin/master`.
- Web response contract `{ success: true, data, meta? }` đã document.
- Error contract RFC 7807 Problem Details đã document.
- OpenAPI validation workflow và Spectral rules đã thêm.
- Shared web API client giữ dưới `web/packages/api-client`.
- Restaurant revenue và analytics formatting đã localize.
- SePay runtime không còn tự tạo intent thành công khi thiếu cấu hình bắt buộc.
- Contract AI chat live-provider, fail-closed, telemetry và history theo user có focused tests.
- Core setup, testing và deployment docs đã bắt đầu có English, Vietnamese, Japanese.
- Mobile Flutter gate đã được kiểm lại local với `flutter pub get --enforce-lockfile`, `flutter analyze` sạch, full `flutter test` pass 225 test và `flutter build apk --debug` pass; hardening rerun sau `17e4661` cũng pass `flutter analyze` và full `flutter test` 225 test. GitHub Actions đang bị chặn do token/auth hoặc billing account, nên cần rerun remote checks sau khi xử lý.
- Mobile runtime UI hiện không còn hardcoded presentation string theo targeted scanner cho các flow dispatch/cancel đã chạm, không còn action runtime "coming soon", parse timestamp backend bằng sentinel deterministic thay vì fallback current-time, và release build bắt buộc cấu hình `API_BASE_URL` rõ ràng.
- Bản đồ tracking customer/driver/Restaurant hiện dùng `routePolyline` thật từ backend, hydrate snapshot REST `/orders/:id/tracking` trước realtime, tách telemetry trail khỏi planned route, hỗ trợ route phase pickup/dropoff, xoá route geometry stale khi đổi phase hoặc snapshot không có route, normalize GPS metadata của driver theo contract km/h của backend và không tự bịa ETA đường thẳng khi route provider không khả dụng. Event `driver:assigned` ban đầu để `etaMinutes` null cho tới khi tracking có route Google/OSRM thật.
- Dispatch hiện enqueue job có tọa độ nhà hàng và attempt metadata, xử lý an toàn legacy malformed queue jobs và parse đúng ioredis `GEOSEARCH WITHDIST` tuple rows.
- Shared tag input của Admin không còn tự sinh placeholder tiếng Anh mặc định; caller phải truyền placeholder đã localize.
- Evidence local mới nhất cho Batch 4 merged worktree: backend Prisma validate/typecheck/lint/build và Jest (110 suites / 802 tests), web typecheck/lint/build và Vitest (Admin 37 files / 155 tests; Restaurant 31 files / 100 tests), Playwright Chromium + Firefox 70/70, Docker health checks, tenant isolation, visual contract, axe serious/critical smoke, Flutter tests mobile (225), Android debug APK build, OpenAPI Spectral lint và high-confidence secret scan đều pass trước hardening refresh này. Targeted rerun mới pass backend 9 suites / 134 tests, Admin 2 files / 12 tests, mobile 19 tests, backend/admin typecheck, backend/admin lint và Flutter analyze.
- Remote CI xanh đầy đủ gần nhất ở `e776f5c`: Gitleaks, Lint, Build Check, SBOM, Trivy, CodeQL, CI, E2E Tests và Integration Smoke Gate. CI head hiện tại bị GitHub token/auth hoặc billing chặn trước khi jobs start.

### Mobile

- Giữ app Flutter customer/driver khớp Batch 4 API contract đã ổn định.
- Không regenerate hoặc commit mobile API client nếu OpenAPI contract chưa được refresh có chủ đích.
- Chỉ reconcile Violet/Indigo khi branch refs hoặc patch artifacts đã review xuất hiện; danh sách head hiện tại của `origin` không có các branch này.
- Chạy lại `flutter analyze` và `flutter test` sau các thay đổi backend/web contract ảnh hưởng mobile.

## Đang làm trước deployment

### Backend

- Xóa runtime mock/fallback còn lại trong payment, promotion, support, analytics và reporting.
- Hoàn thiện Admin export jobs canonical trên model `AdminExportJob`.
- Hoàn thiện Platform Settings endpoints dựa trên `PlatformSetting`.
- Verify order/revenue/category attribution theo giá trị từng order item.
- Verify benchmark privacy: cohort ít nhất 10 nhà hàng, nếu không dùng aggregate platform không lộ danh tính.
- Verify support SLA theo giờ ICT, pause khi chờ khách.

### Admin dashboard

- Hoàn thiện dashboard KPI, comparison, timeseries, heatmap và recent orders bằng dữ liệu thật.
- Hoàn thiện orders list/detail/status update và WebSocket `/events` status thật với polling fallback có kiểm soát.
- Hoàn thiện restaurant approval detail, menu/orders/reviews/finance/KPI.
- Hoàn thiện users, wallet, voucher, refund và KYC.
- Hoàn thiện promotions CRUD, toggle, analytics và overlap validation.
- Hoàn thiện support queue/detail/messages/reply/internal note/bulk action/macros/CSAT.
- Hoàn thiện audit logs và exports với progress/download.
- Settings và AI monitor phải dùng dữ liệu thật hoặc degraded state rõ.

### Restaurant dashboard

- Hoàn thiện profile, onboarding và operating hours.
- Hoàn thiện overview KPI từ dữ liệu thật.
- Hoàn thiện menu categories/items/options visibility và reorder.
- Hoàn thiện kanban orders, detail, status transitions và order chat.
- Hoàn thiện reviews và merchant reply.
- Hoàn thiện revenue drill-down và export formats.
- Hoàn thiện promotions CRUD, targeting preview, scheduling, analytics và broadcast.
- Hoàn thiện staff invitations, permissions và shift schedule.
- Hoàn thiện insights, menu analytics và privacy-safe benchmark.
- Dùng shared notifications từ `/notifications`.

### UI, UX và thiết kế

- Giữ 7 màn Stitch desktop hiện có làm visual baseline.
- Chỉ thêm Stitch design có chọn lọc khi còn screen gap thật.
- Áp dụng dark sidebar, orange/green accents, dense cards, filter/action bar nhất quán.
- Thêm loading, empty, retryable error, permission-denied, disabled, success và destructive-confirmation states.
- Validate responsive ở 1440, 1280, tablet và mobile.
- Logo/asset đã duyệt phải nằm trong app `public/` hoặc docs asset folders, không đặt ở repo root.

### Maps và AI chatbot

- Maps phải phản ánh trạng thái provider thật: Google Maps khi có cấu hình, OSRM/backend fallback khi đúng product behavior, degraded state rõ nếu không có đường chạy.
- AI chatbot dùng LLM provider adapter, DeepSeek là mặc định hiện tại; thiếu cấu hình thì trả degraded response rõ.
- API key từng bị lộ phải rotate trước production và chỉ lưu trong ignored env hoặc secret store của provider.

### Repository hygiene và branch salvage

- Không raw-merge stale team branches.
- Chỉ port hành vi đã chứng minh từ Amber, Steel và audit branches bằng focused tests.
- Nếu ref Violet hoặc Indigo xuất hiện lại, salvage mobile hunk-by-hunk với focused Flutter tests và ghi disposition tại đây.
- Generated screenshots, local caches, backup folders và assistant private files không được vào Git.
- Giữ `master` là remote branch live duy nhất trừ khi chủ ý mở review branch mới.

## Gate bắt buộc trước deployment

- `pnpm install --frozen-lockfile` trong môi trường sạch.
- Backend Prisma validate/generate/migration checks, typecheck, lint, Jest, contract tests và build.
- Web API client generation/typecheck và OpenAPI validation.
- Admin và Restaurant typecheck, ESLint không warning, Vitest và production builds.
- Playwright Chromium và Firefox cho login, RBAC, locale, promotions, support, exports, WebSocket orders, menu, revenue, staff, insights, maps và AI chatbot.
- Axe không có serious/critical.
- Visual regression với Stitch screens đã duyệt.
- Tenant-isolation tests cho restaurant-scoped reads/writes.
- Secret scan, artifact scan và `.gitignore` hygiene check.

## Kế hoạch deploy sau khi gate xanh

1. Giữ `master` sạch và đã push.
2. Khôi phục GitHub Actions token/auth/billing và rerun các workflow CI/security đang bị chặn.
3. Đính kèm branch disposition, test matrix, rejected changes và known degraded states vào release report.
4. Cài/auth Supabase CLI, xác minh project access và chỉ deploy database/realtime khi secret đã rotate hợp lệ.
5. Link repo tới đúng Vercel projects, xác minh env và chỉ deploy web sau khi local/remote gates xanh.
6. Chạy production smoke tests, realtime checks, map checks, AI chatbot checks, export checks, mobile API checks và keep-alive monitoring.

## Deferred khỏi Batch 4

- Migration major Next.js, React, ESLint hoặc Node.
- httpOnly cookie auth migration.
- Data warehouse hoặc OLAP redesign.
- Nodemailer major migration.
- Dependency major trái Next.js 14, React 18 hoặc ESLint 8.
- Deployment trước khi tất cả gates xanh.
