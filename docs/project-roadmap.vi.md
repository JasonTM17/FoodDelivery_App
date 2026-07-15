# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 15/07/2026: **runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc` đang chạy trên Railway API/worker/migrator và hai ứng dụng Vercel; health đúng revision, public login smoke `vi/en/ja` và trạng thái 41 migration Supabase đều xanh, nhưng vẫn chưa đủ điều kiện chứng nhận production đầy đủ**.

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

- Bằng chứng local lịch sử: Docker volume sạch `foodflow-batch4-e2e` đã apply các migration hiện hành lúc đó, seed dữ liệu tạm, index RAG và pass Playwright 204/204. Các con số này chỉ là evidence ngày 14/07/2026, không phải kết quả của runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc` hay chứng nhận production.
- Kiểm tra Prisma live báo đủ 41 migration trong repository đã apply, không còn migration chờ. Database, Redis và Supabase Storage đều ready. Các record rolled-back hoặc checksum provenance lịch sử vẫn là audit history; không đảo hay sửa SQL đã apply.
- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Railway migrate `6438d9ff-caa3-433c-afc1-81c4885797a8`, API `340fd29c-8198-41f0-8dc4-a097ecbe3438` và worker `6c2201d1-ccce-444f-b592-4ac4fb20c287` thành công tại runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc`. API health/readiness trả đúng revision với database, Redis và Supabase Storage ready; worker poll bình thường và RAG chủ động tắt vì chưa có DeepSeek.
- Google Maps là tùy chọn. Khi không có Google Directions hoặc OSRM do dự án sở hữu, routing trả `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` nhưng tiến trình vẫn healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing còn chưa cấu hình hoặc chưa smoke.
- Vercel Admin `dpl_3Gm3hB31QJrrRq7QPSSQD9x2Wkgp` và Restaurant `dpl_8YVNGQCyWCzkCezeXYD1gKAb89CZ` là hai exact redeploy của SHA `17584153ff256b74a3413ae9844f4f27bff038cc`. Health canonical trả revision này và public login smoke `vi/en/ja` pass; role journey Admin/Restaurant/Customer/Driver có xác thực vẫn còn chờ.
- Các alias Docker Hub SHA, `v0.1.1` và `latest` khớp digest cho cả bốn image runtime. Manifest SHA public trên GHCR khớp digest; tài liệu không tuyên bố promote GHCR semver rộng hơn.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Giữ baseline API/worker/Redis đã verify; release sau deploy từ một SHA immutable và kiểm lại health/readiness/worker polling.
2. Chỉ cấu hình integration cần chứng nhận qua secret store; không bịa Google Maps hay provider khác.
3. Smoke production Customer/Driver/Admin/Restaurant có xác thực, token refresh, GPS snapshot/delta/reconnect, map/routing đã cấu hình, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device.
4. Giữ baseline health đúng SHA `17584153` của Admin/Restaurant; chạy lại public và authenticated smoke mỗi khi web deployment hoặc API revision đổi.
5. Với release tương lai, chỉ promote artifact immutable đã verify sau khi các smoke còn lại xanh; không rebuild hoặc retag digest chưa verify.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
