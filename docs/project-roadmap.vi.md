# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 14/07/2026: **integration và quality gate current-head trên `master` đã xanh; managed deployment chưa hoàn tất; chưa đủ điều kiện production**.

## Đã hoàn thành và đã tích hợp

- Consolidate có kiểm soát các phần backend, Admin, Restaurant, mobile, AI, realtime, map/tracking, docs và DevOps có thật.
- Cleanup branch/worktree đã hoàn tất: chỉ còn `master`, không còn linked integration worktree. Không tạo lại branch integration lịch sử.
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

- Chạy smoke riêng Customer và Driver từ entrypoint tường minh: auth rồi restore/logout session, chứng minh private realtime được phép và bị từ chối cross-role/cross-tenant, sau đó chạy role flow. FCM live vẫn cần thiết bị/token đã đăng ký có kiểm soát và credential production thật; test lifecycle local không chứng minh provider delivery.
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

## Trạng thái managed đã xác minh và blocker

- Cả 10 workflow current-head đều xanh: Backend 141 suite / 1043 test, Mobile 352 test, Docker E2E isolated 204/204 trong 5.8 phút.
- Supabase đã apply đủ 35 migration. Đã kiểm trực tiếp private Broadcast authorization, split Storage, bỏ anonymous public-object listing, RLS và production business/RAG đều 0 row. Một migration lịch sử lỗi zero-step được giữ trạng thái rolled back, không đảo hay sửa SQL đã apply.
- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Railway topology, Redis và migrator current-head đều pass. Public API vẫn 404 vì API/worker chưa deploy và thiếu đúng 15 cấu hình provider thật thuộc Maps/OSRM, DeepSeek, SePay/webhook, SMTP, FCM và Twilio. GPS/Broadcast production và FCM live vẫn bị chặn.
- Admin/Restaurant đều GitHub-linked và READY trên Vercel; health/login canonical trả 200, không request tunnel/localhost hoặc console error. Smoke auth/API/GPS vẫn phụ thuộc Railway.
- Bốn image SHA current-head chưa publish. Package GHCR private Admin/Restaurant chưa nối với repository nên workflow bị 403 cho tới khi cấp repository access. Chưa được promote semver/`latest`.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Rotate credential bị lộ và nhập 15 cấu hình Railway thật qua secret store.
2. Deploy API/worker cùng một immutable SHA, kiểm health/readiness/Cron; migrator current-head đã hoàn tất.
3. Smoke production Customer/Driver auth, private-realtime allow/deny, token refresh, GPS snapshot/delta/reconnect, Storage, map, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device.
4. Smoke lại đúng deployment Vercel Admin/Restaurant với Railway khỏe.
5. Nối package GHCR private Admin/Restaurant với repository, cấp Actions write, rerun bốn image SHA rồi pull/scan/smoke ở môi trường sạch.
6. Chỉ tạo `v4.0.0` và promote `latest` sau khi production smoke xanh; cập nhật report/digest/About.
8. Xác minh commit deploy vẫn là `origin/master` dự định; không tạo lại hoặc push branch integration lịch sử.
9. Publish Docker SHA → immutable `v4.0.0` → manual `latest`.
10. Chốt report, digest, GitHub About/topics/homepage và landing notes.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
