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
- Bằng chứng visual local current-source: sau khi sửa Restaurant Kanban mobile, CLS khoảng 0.0037. Đây là kiểm tra regression có đo lường, không phải pixel baseline đầy đủ hay phê duyệt production.
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

## Bằng chứng current-source và blocker bên ngoài

- Project Docker volume sạch current-source `foodflow-batch4-e2e` đã apply đủ 36 migration, seed 50 restaurant, 50 driver, 100 customer, 500 historical order, 9 canonical order và 123 review, index 402 RAG document, rồi pass Playwright 204/204 trong 6,6 phút. CLS trace Restaurant Kanban mobile khoảng 0.0037 sau khi sửa. Đây chỉ là kết quả local.
- Supabase production đã apply và checksum-verify đủ 36 migration. Migration 36 giới hạn FCM revocation theo token cùng registration capability; primary key `token,registration_id` đã được kiểm tra trực tiếp. Một migration lịch sử lỗi zero-step được giữ trạng thái rolled back, không đảo hay sửa SQL đã apply.
- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Rollout và xác minh phụ thuộc Railway bị chặn từ bên ngoài bởi cấu hình cùng credential provider thật cần thiết. Không được claim Railway API/worker production health; GPS/Broadcast live và FCM tới thiết bị kiểm soát vẫn chưa xác minh. Test notification/lifecycle local không chứng minh provider delivery.
- Xác minh production Admin/Restaurant vẫn phụ thuộc rollout Supabase được ủy quyền và Railway API/worker đã xác minh. Không được xem evidence web trước đây là phê duyệt production đầu-cuối.
- Bốn image SHA current-head chưa publish. Package GHCR private Admin/Restaurant chưa nối với repository nên workflow bị 403 cho tới khi cấp repository access. Chưa được promote semver/`latest`.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Rotate credential bị lộ và nhập 15 cấu hình Railway thật qua secret store.
2. Xác nhận `prisma migrate status` vẫn up to date; migration 36 và khóa capability ghép của FCM revocation đã được kiểm tra trên Supabase production.
3. Deploy API/worker cùng một immutable SHA khi đã có đủ cấu hình provider thật, rồi kiểm health/readiness/Cron.
4. Smoke production Customer/Driver auth, private-realtime allow/deny, token refresh, GPS snapshot/delta/reconnect, Storage, map, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device.
5. Smoke lại đúng deployment Vercel Admin/Restaurant với Railway đã xác minh.
6. Nối package GHCR private Admin/Restaurant với repository, cấp Actions write, rerun bốn image SHA rồi pull/scan/smoke ở môi trường sạch.
7. Chỉ tạo `v4.0.0` và promote `latest` sau khi production smoke xanh; cập nhật report/digest/About.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
