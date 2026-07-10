# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Vercel, smoke production, fast-forward integration `HEAD` vào `master`, rồi publish Docker immutable.

Trạng thái 10/07/2026: **đang hardening; chưa đủ điều kiện production**.

## Đã hoàn thành trên local integration

- Consolidate có kiểm soát các phần backend, Admin, Restaurant, mobile, AI, realtime, map/tracking, docs và DevOps có thật.
- Remote chỉ còn `master`; giữ local integration tới final fast-forward.
- Loại fake empty/zero fallback và thêm runtime contract validation trên critical Admin/Restaurant screens.
- Sửa locale Restaurant theo URL vi/en/ja, contrast/focus accessibility.
- Supabase realtime outbox/RLS/token, Storage adapter, Postgres job outbox/Cron; web hỗ trợ Supabase provider explicit.
- DeepSeek `deepseek-v4-flash`, session/usage telemetry và fail-closed states.
- GPS fresh-only, route phase/provider geometry/ETA, tenant tracking và bỏ hardcoded map fallback.
- Node 22.13+, pnpm 11.11, frozen install.
- Bốn image non-root multi-arch và Docker promotion fail-closed.
- Pipeline screenshot/GIF current source và docs architecture/deploy/testing mới.
- Admin dùng locale URL làm nguồn chuẩn, KPI overview đã dịch, token màu đạt accessibility và media đã recapture; targeted vi/en/ja Chromium/Firefox locale + axe đều pass.

## Đang làm trước release

### UI/UX/i18n/media

- Audit fresh context `vi/en/ja`: title, `html lang`, visible/aria text, number/date/currency, cookie isolation.
- Hoàn thiện responsive/keyboard/axe cho dashboard, approval, promotion, audit/export, staff, benchmark, AI monitor, map/order.
- So implementation với Stitch/design artifact và chốt visual regression.

### Mobile

- Chuyển production realtime từ Socket.IO sang `POST /api/realtime/token` + Supabase channel giống web.
- Chỉ giữ Socket.IO cho local/self-hosted nếu cần.
- Reconcile Violet/Indigo chỉ khi ref thật tồn tại; không bịa branch.
- Rerun API contract, vi/en/ja, customer/driver, map/GPS, offline/reconnect và build.

### Backend/production

- Audit dependency Redis còn lại trên Vercel: provision rõ ràng hoặc loại bỏ an toàn.
- Validate 22 migration trên fresh PostGIS và Supabase target.
- Test RLS/publication/storage/cross-tenant trực tiếp trên Supabase.
- Live smoke DeepSeek, route, SePay, notification, export, storage, Cron bằng secret đã rotate.
- Pin mutable third-party Compose image liên quan release.

### Test/security

- Full backend Prisma/typecheck/lint/Jest/build.
- Full web frozen install/typecheck/ESLint/Vitest/build.
- Full Playwright Chromium+Firefox, axe critical pages = 0, visual/Stitch, tenant isolation.
- Flutter analyze/full tests/build sau realtime migration.
- Secret scan/Gitleaks/CodeQL/audit/Trivy/SBOM/actionlint/ShellCheck.

## Blocker bên ngoài

- GitHub Actions hết billing/auth/token nên chưa có current-head remote green.
- Supabase CLI thiếu access token và production database URLs.
- Vercel API thiếu env database/provider/integration; Admin/Restaurant thiếu Supabase anon key.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Freeze final source và full local gate.
2. Khôi phục/pass mọi GitHub workflow.
3. Nhập secret rotate qua prompt/dashboard và pass preflight.
4. Deploy Supabase migration/RLS/Realtime/Storage.
5. Deploy Vercel API, health/readiness/Cron.
6. Deploy Admin/Restaurant với verified API alias.
7. Smoke realtime/map/chatbot/export/payment/notification/tenant.
8. Push `HEAD` trực tiếp vào `origin/master`, xác minh remote một branch và `0 0`.
9. Publish Docker SHA → immutable `v4.0.0` → manual `latest`.
10. Chốt report, digest, GitHub About/topics/homepage và landing notes.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau parity/signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; xóa local integration chỉ khi `HEAD == origin/master`.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
