# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 16/07/2026: **runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7` đang chạy trên Railway API/worker/migrator và hai ứng dụng Vercel; health đúng revision, trạng thái 41 migration Supabase và production smoke GPS/private Broadcast/PostGIS có xác thực đều xanh. Bằng chứng bốn role Chrome/API thuộc SHA lịch sử `17584153`, public Restaurant hiện bị chuyển hướng sang Vercel SSO và chứng nhận production đầy đủ vẫn no-go**.

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

- Customer/Driver đã pass auth API production read-only, private Realtime và cross-role denial, sau đó toàn bộ fixture được xóa. Vẫn phải chạy từng native launcher để chứng minh restore/logout session và UI role thật. FCM live cần thiết bị/token kiểm soát cùng credential production thật; test local không chứng minh provider delivery.
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

- Bằng chứng local lịch sử: Docker volume sạch `foodflow-batch4-e2e` đã apply các migration hiện hành lúc đó, seed dữ liệu tạm, index RAG và pass Playwright 204/204. Các con số này chỉ là evidence ngày 14/07/2026, không phải kết quả của runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7` hay chứng nhận production.
- SHA `a703ece` đang deploy có 41 migration đã apply; Database, Redis và Supabase Storage đều ready. Migration ứng viên thứ 42 đã xác minh local nhưng chưa deploy trước khi PR được review và rollout đồng bộ. Các record rolled-back hoặc checksum provenance lịch sử vẫn là audit history; không đảo hay sửa SQL đã apply.
- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Railway migrate `49579ce7-9808-4a35-afcc-82432943bc70`, API `9c823cd9-290a-4eb0-94a2-fdf01c3f0b06` và worker `413dedcc-6ba7-46be-8c99-901f592c558f` thành công tại runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`. API health/readiness trả đúng revision với database, Redis và Supabase Storage ready; worker poll bình thường và RAG chủ động tắt vì chưa có DeepSeek.
- Google Maps là tùy chọn. Khi không có Google Directions hoặc OSRM do dự án sở hữu, routing trả `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` nhưng tiến trình vẫn healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing còn chưa cấu hình hoặc chưa smoke.
- Các alias production canonical của Vercel Admin và Restaurant đều Ready và trả SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`. Public login smoke `vi/en/ja` và smoke GPS/Supabase có xác thực đã pass; các role journey có xác thực rộng hơn vẫn đang chờ.
- Các alias SHA, `v0.1.2` và `latest` trên Docker Hub lẫn GHCR public khớp digest cho cả bốn image runtime; Docker Publish run `29474270122` và Release run `29478484699` đã xác minh các manifest được promote.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Giữ baseline API/worker/Redis đã verify; release sau deploy từ một SHA immutable và kiểm lại health/readiness/worker polling.
2. Chỉ cấu hình integration cần chứng nhận qua secret store; không bịa Google Maps hay provider khác.
3. Smoke production trên revision hiện tại cho Customer/Driver/Admin/Restaurant có xác thực, token refresh, active-order GPS snapshot/delta/reconnect, map/routing đã cấu hình, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device. Giữ evidence bốn role lịch sử nhưng không gắn nhãn thành chứng nhận hiện tại.
4. Giữ baseline health đúng SHA `a703ece` của Admin/Restaurant; chạy lại public và authenticated smoke mỗi khi web deployment hoặc API revision đổi.
5. Với release tương lai, chỉ promote artifact immutable đã verify sau khi các smoke còn lại xanh; không rebuild hoặc retag digest chưa verify.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
