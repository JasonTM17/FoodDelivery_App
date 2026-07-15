# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 15/07/2026: **runtime candidate đã deploy `f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b` có backend, CI, registry, Supabase 41 migration, Railway/Vercel đúng revision và GPS cấp API đã xanh; vẫn chưa đủ điều kiện production đầy đủ**.

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

- Giữ Railway managed Redis đã verify healthy và theo dõi readiness.
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

- Project Docker volume sạch `foodflow-batch4-e2e` đã apply 36 migration hiện hành lúc chạy, seed 50 restaurant, 50 driver, 100 customer, 500 historical order, 9 canonical order và 123 review, index 402 RAG document, rồi pass Playwright 204/204 trong 6,6 phút. Database tạm mới hơn đã apply riêng đủ 38 migration và kiểm tra invariant địa chỉ mặc định. Phải chạy lại full Docker/Playwright trên clean head cuối; đây chỉ là kết quả local.
- Audit Supabase read-only hiện tại xác nhận migration 1–38, gồm index địa chỉ mặc định và UUID default. Record 1–36 trước đó chỉ còn là lịch sử. Một migration lịch sử lỗi zero-step được giữ trạng thái rolled back, không đảo hay sửa SQL đã apply.
- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Runtime candidate `52f4336` pass 144 suite / 1065 test, typecheck, lint, build, toàn bộ workflow GitHub được trigger, runtime smoke đa kiến trúc và scan image High/Critical. Railway migrate `a9002614-ed2a-438c-9a4e-7170954052fc`, API `4e51ae50-1218-4c1b-a315-3c31ddf6de5c` và worker `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` chạy image SHA immutable thành công. API health/readiness báo database, Redis, Supabase Storage up; worker poll bình thường và RAG chủ động tắt vì chưa có DeepSeek.
- Google Maps là tùy chọn. Khi không có Google Directions hoặc OSRM do dự án sở hữu, routing trả `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` nhưng tiến trình vẫn healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing còn chưa cấu hình hoặc chưa smoke.
- Deployment Admin/Restaurant của record artifact `ed25399` trước đó đang READY trên Vercel, health/login trả 200. Vẫn phải smoke chính xác hai deployment đó qua API Railway hiện tại bằng role đã xác thực.
- Bốn image SHA `ed25399` đã publish trên Docker Hub và GHCR public với digest liên registry khớp nhau. Mọi package đã nối repository và cấp Actions write. Chưa được promote semver/`latest`.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Giữ baseline API/worker/Redis đã verify; release sau deploy từ một SHA immutable và kiểm lại health/readiness/worker polling.
2. Chỉ cấu hình integration cần chứng nhận qua secret store; không bịa Google Maps hay provider khác.
3. Smoke production Customer/Driver auth, token refresh, GPS snapshot/delta/reconnect, Storage, map/routing đã cấu hình, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device.
4. Smoke lại đúng deployment Vercel Admin/Restaurant với API Railway hiện tại.
5. Pull/scan/runtime-smoke bốn image SHA ở môi trường sạch.
6. Chỉ tạo `v4.0.0` và promote `latest` sau khi production smoke xanh; cập nhật report/digest/About.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
