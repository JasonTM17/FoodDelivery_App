# Roadmap dự án FoodFlow

Ngôn ngữ: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

Roadmap này phản ánh hướng của integration branch. Nó tách phần đã landing khỏi phần còn phải test trước production deployment.

## Ưu tiên hiện tại: Batch 4 web/backend parity và mobile stabilization

Mục tiêu: đưa Admin và Restaurant dashboard lên mức production-grade với dữ liệu backend thật, sau đó giữ app mobile/customer khớp Batch 4 contract đã ổn định, đồng thời giữ Next.js 14, React 18, ESLint 8, pnpm 11.7.0 đã pin và constraints Flutter hiện có.

Batch 4 chưa hoàn tất nếu local gates, E2E, accessibility, visual checks, tenant-isolation checks và deployment validation chưa pass.

## Đã landing trong integration branch

- Clean integration worktree trên `codex/batch4-integration`.
- Web response contract `{ success: true, data, meta? }` đã document.
- Error contract RFC 7807 Problem Details đã document.
- OpenAPI validation workflow và Spectral rules đã thêm.
- Shared web API client giữ dưới `web/packages/api-client`.
- Restaurant revenue và analytics formatting đã localize.
- SePay runtime không còn tự tạo intent thành công khi thiếu cấu hình bắt buộc.
- Vietnamese AI chat fast paths có focused tests.
- Core setup, testing và deployment docs đã bắt đầu có English, Vietnamese, Japanese.
- Mobile Flutter gate đã được kiểm lại local ngày 2026-07-04 tại head hiện tại `78bf643` với `flutter analyze` sạch và `flutter test` pass 133 test. GitHub Actions cho `78bf643` đang bị chặn trước khi runner start do trạng thái billing/spending-limit của account, nên cần rerun remote checks sau khi xử lý.
- Mobile runtime UI hiện không còn hardcoded presentation string theo targeted scanner cho các flow dispatch/cancel đã chạm, không còn action runtime "coming soon", parse timestamp backend bằng sentinel deterministic thay vì fallback current-time, và release build bắt buộc cấu hình `API_BASE_URL` rõ ràng.
- Bản đồ tracking customer/driver hiện dùng `routePolyline` thật từ backend, tách telemetry trail khỏi planned route, hỗ trợ route phase pickup/dropoff, xoá route geometry cũ khi đổi phase, normalize GPS metadata của driver theo contract km/h của backend và không tự bịa ETA đường thẳng khi route provider không khả dụng.
- Shared tag input của Admin không còn tự sinh placeholder tiếng Anh mặc định; caller phải truyền placeholder đã localize.
- Remote CI xanh đầy đủ gần nhất ở `e776f5c`: Gitleaks, Lint, Build Check, SBOM, Trivy, CodeQL, CI, E2E Tests và Integration Smoke Gate. CI head hiện tại `78bf643` bị GitHub billing/spending-limit chặn trước khi jobs start.

### Mobile

- Giữ app Flutter customer/driver khớp Batch 4 API contract đã ổn định.
- Không regenerate hoặc commit mobile API client nếu OpenAPI contract chưa được refresh có chủ đích.
- Chỉ reconcile Violet/Indigo khi branch refs hoặc patch artifacts đã review xuất hiện; danh sách head hiện tại của `origin` không có các branch này.
- Chạy lại `flutter analyze` và `flutter test` sau các thay đổi backend/web contract ảnh hưởng mobile.

## Đang làm trước draft PR

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

1. Push `codex/batch4-integration`.
2. Mở draft PR vào `master`.
3. Đính kèm branch disposition, test matrix, rejected changes và known degraded states.
4. Sau required checks xanh, merge bằng merge commit.
5. Deploy database/realtime lên Supabase chỉ khi secret đã rotate hợp lệ.
6. Deploy web lên Vercel chỉ sau khi local và PR gates xanh.
7. Chạy production smoke tests, realtime checks, map checks, AI chatbot checks và keep-alive monitoring.

## Deferred khỏi Batch 4

- Migration major Next.js, React, ESLint hoặc Node.
- httpOnly cookie auth migration.
- Data warehouse hoặc OLAP redesign.
- Nodemailer major migration.
- Dependency major trái Next.js 14, React 18 hoặc ESLint 8.
- Deployment trước khi tất cả gates xanh.
