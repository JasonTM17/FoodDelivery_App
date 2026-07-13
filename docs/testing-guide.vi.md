# Hướng dẫn kiểm thử FoodFlow

## Quy tắc release

Chỉ được coi là xanh khi final source head pass toàn bộ local gate, remote CI mới, provider preflight và production smoke. Focused test chỉ chứng minh đúng cụm đó; số lịch sử hoặc script có skip không được dùng làm release approval.

## Evidence hiện tại

Scoped hardening evidence ngày 13/07/2026:

| Khu vực | Kết quả |
|---|---|
| Backend | 138 suite / 1016 test, Prisma validate/generate, typecheck, lint và build đều pass. |
| Database | Repository track 33 migration có thứ tự. Supabase production lần cuối khớp checksum tại 33 migration đó. Một Docker test volume lịch sử tái sử dụng còn 34 dòng migration-history đã apply và một dòng rolled back; đây không phải evidence current-source hay số migration fresh. |
| Driver Flutter | Flutter analyze pass. Full 325 test pass trước availability-race patch cuối; 4 test session/race focused pass sau patch. Compiler Windows treo trước khi chạy test sau cache clean nên vẫn cần full final rerun. |
| Web | Admin 195 test, Restaurant 134 test; cả hai app pass typecheck/lint và production build với Vercel production env đã xác minh. |
| Browser E2E | Ma trận Docker isolated current-source trên volume sạch pass 68/68 ở Chromium, Firefox và Pixel 5 (204/204 trong 6.8 phút, không retry/failure). Đây chỉ là local evidence, không phải remote CI hay production approval. |
| FCM live send | Chưa chạy: cần project credential production và controlled device token. |

### Docker E2E và RAG theo current source — 13/07/2026

Repository track 33 migration. Lượt isolated current-source trên volume sạch báo đủ 33 migration completed, không có pending. Seed disposable tạo 50 restaurant, 50 driver, 100 customer và 500 historical order. Một Docker test volume lịch sử tái sử dụng còn 34 dòng `_prisma_migrations` đã apply và một dòng rolled back vì từng ghi một migration zero-step đã bị loại khỏi source; volume này không phải bằng chứng số migration fresh. Supabase production lần cuối khớp checksum tại 33 migration được track, và Railway migrator rollout được ủy quyền vẫn là release gate. Overlay chạy worker riêng từ backend image, không dùng API process xử lý nền. Sau seed, worker được khởi động, ghi `FoodFlow Worker started`, và hoàn tất RAG sync `indexed: 402`, `unchanged: 0`, `failed: 0`, `deactivated: 0`.

Worker current-source index 402 RAG document sau fresh seed. Không có DeepSeek key nên embedding vẫn pending và không có vector giả. Volume tái sử dụng cũ còn 44 FAQ và 8 policy row có source ID rỗng từ lần local cũ; các dòng lịch sử này không tính vào evidence worker hiện tại. Không dữ liệu nào ở đây là production hoặc phê duyệt embedding/provider production.

Image API/Admin/Restaurant vừa rebuild pass toàn bộ ma trận: Chromium 68/68, Firefox 68/68 và Pixel 5 68/68 (204/204 trong 6.8 phút, không retry/failure). Coverage gồm axe serious/critical, auth/refresh/RBAC, customer order qua API, hội tụ trạng thái REST, tenant isolation, map, contract, cấu trúc visual, navigation responsive và Restaurant form-login/reload persistence. Image local mang `revision=local`, nên chỉ chứng minh checkout hiện tại chứ không chứng minh artifact immutable. CI remote được cấu hình dùng cùng Compose overlay và ma trận ba project, nhưng vẫn cần một lượt remote được ủy quyền chạy mới.

Kết quả này là local verification mạnh, chưa phải release approval. Vẫn phải có remote CI mới, provider preflight, production smoke và live FCM delivery bằng controlled device.

### Database runtime evidence lịch sử 13/07/2026

Container PostGIS + pgvector dùng một lần đã apply đủ 33 migration, xác minh PostGIS, vector, `rag_documents`, source/content index và cosine HNSW index. Lệnh `db:big-seed` tạo thật trong DB này 50 restaurant đã duyệt, 50 driver, 100 customer, 509 order, 123 review và 10 promotion; đây là bằng chứng generator ghi database, không phải fixture fix cứng lúc runtime. Worker local đồng bộ 32 document restaurant/menu sống; do chưa có DeepSeek key nên cả 32 ở trạng thái chờ embedding, không sinh vector giả.

Supabase production lần cuối được xác minh checksum khớp tại 33 migration được track. Users, restaurants, orders, driver profiles và RAG documents production vẫn bằng 0; tuyệt đối không chạy demo/big seed ở đó. Vì vậy production hiện là DB trống, chưa được tuyên bố là đã có big data.

Evidence web/browser/container rộng hơn được giữ trong [release report](batch4-release-report.md), nhưng chỉ là lịch sử cho đến khi chạy lại trên final source head. Full backend/web build, axe/visual/Stitch toàn trang, repaired browser E2E, controlled FCM delivery, smoke tenant/realtime/map/AI kiểu production, provider preflight và remote CI hiện tại vẫn bắt buộc.

## Gate tổng

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Partial development phải ghi rõ partial và không được approve release:

```powershell
powershell -File infra/scripts/local-release-gate.ps1 \
  -AllowDirty -SkipInstall -SkipBuild -SkipDeployPreflight
```

## Backend

```powershell
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm exec jest --runInBand
corepack pnpm build
```

Phải test fresh PostGIS bằng `migrate deploy` cho mọi migration trong final source head. Coverage bắt buộc: auth/RBAC, tenant restaurant, order/payment/webhook replay, promotion/notification/export/audit, realtime token/RLS claims, Supabase Storage/job outbox, GPS/route/ETA/dispatch, DeepSeek/session/telemetry và production env validation.

## OpenAPI và web

```powershell
npx -y @stoplight/spectral-cli lint docs/openapi.yaml \
  --ruleset docs/openapi/.spectral.yaml --fail-severity error

cd web
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm --filter foodflow-admin build
corepack pnpm --filter restaurant build
```

Test phải reject malformed success envelope, fake empty/zero business data, sai locale/auth refresh/tenant mutation/realtime provider/map geometry/accessibility.

## Isolated E2E

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
$env:ADMIN_URL='http://localhost:13000'
$env:API_URL='http://localhost:13001/api'
$env:RESTAURANT_URL='http://localhost:13002'
cd web
corepack pnpm test:e2e --project=chromium --project=firefox
```

Port còn lại: Postgres `15432`, Redis `16379`, MinIO `19000/19001`. `127.0.0.1` chỉ dùng cho CORS error-state test.

Coverage: auth, Admin dashboard, Restaurant queue/status, customer order end-to-end, realtime/tracking, tenant isolation, Batch 4 contracts và visual brand/layout. Không được coi 404 shell, console error hoặc unavailable business data là pass.

## Accessibility và visual/Stitch

- Axe serious/critical phải bằng 0 trên tất cả critical page ở Chromium và Firefox, cả normal/error state.
- Kiểm tra keyboard, focus-visible, heading, label/error association, live region, contrast, dialog/portal và locale đúng cho title/`html lang`/aria.
- `visual-contract.spec.ts` hiện kiểm tra cấu trúc và lưu screenshot, chưa phải pixel baseline đầy đủ.
- Trước release phải đối chiếu desktop/responsive với artifact Admin/Restaurant/Stitch cho dashboard, approval, promotion, audit/export, staff, benchmark, map/tracking và mobile flows.
- Không auto-update baseline để che regression; recapture docs media sau khi UI được duyệt.

## Bản đồ và route shipper

Test backend: provider route/cache/failure, bound Việt Nam/service area, timestamp fresh, participant/phase, persisted polyline/distance/duration, remaining ETA và cross-tenant denial.

Test web/mobile: không hardcoded camera/polyline/ETA, bỏ event stale/wrong-order/wrong-phase, chuyển pickup/dropoff đúng state, localized unavailable state, key thật bị giới hạn. Production dùng `post-deploy-smoke.ps1 -RequireRoutePolyline` với active order authorized.

## Supabase Realtime

Test TTL/claims, tất cả channel `private:`, role/customer/restaurant/driver/admin scope, cross-tenant forbidden trước token issue, expired/invalid/anon denial, event đúng tenant nhận đúng một lần. Socket.IO local phải test riêng và không được fallback implicit trong production.

## AI

Không key phải trả fail-closed typed state. Live smoke chỉ dùng `DEEPSEEK_API_KEY` mới rotate và `deepseek-v4-flash` trong server env. Xác minh answer/escalation/session ownership/order context/token/latency/cost/budget/provider error; canned/random text không phải bằng chứng LLM.

## Mobile

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build apk --debug --flavor customer -t lib/main_customer.dart \
  --dart-define=REALTIME_PROVIDER=socketio
flutter build apk --debug --flavor driver -t lib/main_driver.dart \
  --dart-define=REALTIME_PROVIDER=socketio
```

Production release còn phải test token/channel Supabase, cross-scope denial, reconnect/refresh và receive-only dispatch; entry Customer/Driver; permission/GPS/background/offline/reconnect/route phase; KYC upload private và Admin signed review; vi/en/ja; API/base URL fail-closed; cấu hình map và signing production an toàn.

## Docker và security

- Build/smoke `amd64` + `arm64`; kiểm tra bcrypt/BullMQ/MessagePack, Prisma, Sharp, non-root, health, manifest, provenance, SBOM.
- Trivy cả hai kiến trúc, block High/Critical; actionlint/ShellCheck.
- Refuse semver overwrite và so digest sau promotion.
- Chạy `infra/scripts/secret-scan.ps1`, staged diff, Gitleaks/CodeQL/dependency audit/Trivy/SBOM trong CI.
- CI đang hết hạn nên không publish/deploy từ local evidence.

## Evidence

Ghi SHA, UTC, command, môi trường, pass/fail, test count, image digest/architecture và blocker/skip. Không ghi secret/bearer. Trace/video/report có token hoặc user data phải ignore, chỉ curate asset an toàn trong `docs/`.
