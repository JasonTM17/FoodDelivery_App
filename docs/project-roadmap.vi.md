# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 13/07/2026: **integration đã nằm trong `master`; đang hardening; chưa đủ điều kiện production**.

## Đã hoàn thành và đã tích hợp

- Consolidate có kiểm soát các phần backend, Admin, Restaurant, mobile, AI, realtime, map/tracking, docs và DevOps có thật.
- Remote chỉ còn `master`; integration branch là ancestor không có commit riêng. Cleanup worktree/ref sau khi push và xác minh `master == origin/master`.
- Loại fake empty/zero fallback và thêm runtime contract validation trên critical Admin/Restaurant screens.
- Sửa locale Restaurant theo URL vi/en/ja, contrast/focus accessibility.
- Supabase realtime outbox/RLS/token, Storage adapter, Postgres job outbox/Cron; web hỗ trợ Supabase provider explicit.
- DeepSeek `deepseek-v4-flash`, session/usage telemetry và fail-closed states.
- GPS fresh-only, route phase/provider geometry/ETA, tenant tracking và bỏ hardcoded map fallback.
- Node 22.13+, pnpm 11.11, frozen install.
- Bốn image non-root multi-arch và Docker promotion fail-closed.
- Có tooling capture screenshot/GIF và docs architecture/deploy/testing mới. Media hiện có là historical cho tới khi recapture kèm source/runtime reference.
- Admin dùng locale URL làm nguồn chuẩn, KPI overview đã dịch và token màu đạt accessibility. Browser/axe vi/en/ja liên quan là record historical và phải rerun ở final head.
- Mobile managed realtime đã dùng token/channel Supabase scope chặt; GPS và quyết định dispatch đi qua REST xác thực, Socket.IO chỉ còn local/self-hosted.
- KYC tài xế dùng private signed upload, object key theo owner, kiểm tra ảnh, một hồ sơ pending, Admin signed review và onboarding mobile vi/en/ja có kiểu/test.

## Đang làm trước release

### UI/UX/i18n/media

- Audit fresh context `vi/en/ja`: title, `html lang`, visible/aria text, number/date/currency, cookie isolation.
- Hoàn thiện responsive/keyboard/axe cho dashboard, approval, promotion, audit/export, staff, benchmark, AI monitor, map/order.
- So implementation với Stitch/design artifact và chốt visual regression.
- Chỉ recapture media sau khi build/seed source dự định; ghi source commit, Compose/image reference và clean final head hay dirty workspace.

### Mobile release validation

- Reconcile mobile chỉ từ branch, commit và patch evidence xác minh được; không đặt tên, tạo lại hoặc suy diễn ref thiếu.
- Rerun API contract, vi/en/ja, customer/driver, map/GPS, offline/reconnect, realtime denial, KYC và signed release build.
- Xác minh Android production signing và iOS signing trên runner macOS được cấp quyền; debug keystore local chỉ là bằng chứng compile.

### Backend/production

- Audit dependency Redis trên Railway: provision rõ ràng hoặc loại bỏ an toàn.
- Validate mọi migration trong final source head trên fresh PostGIS và Supabase target; không dùng số migration lịch sử cố định.
- Test RLS/publication/storage/cross-tenant trực tiếp trên Supabase.
- Live smoke DeepSeek, route, SePay, notification, export, storage, Cron bằng secret đã rotate.
- Pin mutable third-party Compose image liên quan release.

### Test/security

- Full backend Prisma/typecheck/lint/Jest/build.
- Full web frozen install/typecheck/ESLint/Vitest/build.
- Full Playwright Chromium+Firefox, axe critical pages = 0, visual/Stitch, tenant isolation.
- Flutter frozen fetch/analyze/full tests và customer/driver release build tại final head.
- Secret scan/Gitleaks/CodeQL/audit/Trivy/SBOM/actionlint/ShellCheck.

## Blocker bên ngoài

- GitHub Actions hết billing/auth/token nên chưa có current-head remote green.
- Supabase đã link, đủ 32 migration, private Broadcast/Storage, Data API boundary và ES256 key; business/RAG production còn 0 row vì không chạy seed giả.
- Railway đã có DB/Supabase/Redis/ES256 nhưng còn thiếu credential thật cho Maps/routing, DeepSeek, SePay, SMTP, FCM service account, Twilio và webhook. Admin/Restaurant đã có publishable env nhưng chỉ redeploy sau khi API live.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Freeze final source và full local gate.
2. Khôi phục/pass mọi GitHub workflow.
3. Nhập secret rotate qua prompt/dashboard và pass preflight.
4. Deploy Supabase migration/RLS/Realtime/Storage.
5. Deploy Railway migrator rồi API/worker, kiểm health/readiness/Cron.
6. Deploy Admin/Restaurant với verified API alias.
7. Smoke realtime/map/chatbot/export/payment/notification/tenant.
8. Xác minh commit deploy vẫn là `origin/master` dự định; không tạo lại hoặc push branch integration lịch sử.
9. Publish Docker SHA → immutable `v4.0.0` → manual `latest`.
10. Chốt report, digest, GitHub About/topics/homepage và landing notes.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; cleanup local integration worktree/ref sau push, backup/kiểm patch và xác minh remote tương đương.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
