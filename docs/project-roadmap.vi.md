# Roadmap dự án FoodFlow

## Mục tiêu hiện tại

Chốt Batch 4 thành một production line đã verify: hoàn thiện code/mobile, pass mọi local/remote gate, deploy Supabase + Railway + Vercel, smoke production và publish Docker immutable từ `master` đã verify.

Trạng thái 17/07/2026: **Railway đã healthy lại ở SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` sau khi xoay credential Supabase; sáu URL database, health/readiness và audit migration 42/42 đều pass. Admin và Restaurant trả HTTP 200 nhưng revision bị tách ở `e6def517…` và `977d55f…`, nên chưa được chứng nhận là release thống nhất. Chỉ chứng nhận khi SHA của tag, `origin/master`, Railway API và hai health endpoint Vercel trùng nhau. Thiết bị vật lý và full journey bốn role hiện tại vẫn còn mở**.

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

- Bằng chứng local lịch sử: Docker volume sạch `foodflow-batch4-e2e` đã apply các migration hiện hành lúc đó, seed dữ liệu tạm, index RAG và pass Playwright 204/204. Các con số này chỉ là evidence ngày 14/07/2026, không phải kết quả của runtime hiện tại SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` hay chứng nhận production.
- SHA `84eeac3` đang deploy có đủ 42 migration source active. Database, Redis và Supabase Storage đều ready. Provenance Realtime, Job và Storage chính xác; audit pass 42/42 sau khi khôi phục blob Storage byte-for-byte và tạo backup Supabase ngoài repo.

- Hai cảnh báo extension còn lại là ràng buộc đã phân tích: PostGIS không relocatable; chuyển pgvector sẽ phá search path của Prisma/raw operator hiện tại. Không “làm xanh” advisor bằng thay đổi schema nguy hiểm.
- Snapshot khôi phục Railway: migrate `e61a23bc-ce7e-4ef7-9daa-12160e20f105`, API `5b545476-8e0b-4208-8532-9d696bd5e00f` và worker `e3b8a1cf-6432-4e6b-ac09-6e142e338da4` tại runtime SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d`. API health/readiness trả Database, Redis và Supabase Storage ready.
- Google Maps là tùy chọn. Khi không có Google Directions hoặc OSRM do dự án sở hữu, routing trả `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` nhưng tiến trình vẫn healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing còn chưa cấu hình hoặc chưa smoke.
- Recheck phát hiện Admin ở `e6def517334681f3e003685489bd190e72408344` và Restaurant ở `977d55f19ddc4fecafb8a758d2df034f4b6ff21d`; HTTP 200 không đủ để bỏ qua revision lệch. Journey bốn role Chrome/API vẫn là evidence lịch sử ở SHA `17584153`.
- Docker Publish run `29515529360` đã publish bốn manifest SHA immutable `84eeac3` lên Docker Hub/GHCR public; chưa promote `latest`/semver.
- Key provider từng paste phải rotate.

Không được dùng fake value hoặc bypass validation để vượt blocker.

## Chuỗi release

1. Giữ baseline API/worker/Redis đã verify; release sau deploy từ một SHA immutable và kiểm lại health/readiness/worker polling.
2. Chỉ cấu hình integration cần chứng nhận qua secret store; không bịa Google Maps hay provider khác.
3. Smoke production trên revision hiện tại cho Customer/Driver/Admin/Restaurant có xác thực, token refresh, active-order GPS snapshot/delta/reconnect, map/routing đã cấu hình, chatbot, export, payment, notification và tenant; gồm một lần FCM tới controlled device. Giữ evidence bốn role lịch sử nhưng không gắn nhãn thành chứng nhận hiện tại.
4. Publish master SHA immutable tiếp theo, rollout cùng revision qua Railway và hai Vercel project, rồi chạy lại authenticated role/device smoke mà không giữ fixture production.
5. Với release tương lai, chỉ promote artifact immutable đã verify sau khi các smoke còn lại xanh; không rebuild hoặc retag digest chưa verify.

## Sau release

Monitor health/Cron/realtime/AI cost-map-storage-payment; rollout mobile sau production signing; đặt retention outbox/telemetry; cleanup worker tags sau consumer audit; giữ chính sách một branch và không tạo lại historical integration worktree/ref.

## Deferred có chủ đích

Kubernetes/microservice khi chưa có metric; Parquet khi chưa có writer thật; broad public realtime/RLS bypass; recreate branch không tồn tại; deploy từ local-only evidence.
