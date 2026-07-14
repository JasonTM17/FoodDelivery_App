# Hướng dẫn kiểm thử FoodFlow

## Quy tắc release

Chỉ được coi là xanh khi final source head pass toàn bộ local gate, remote CI mới, provider preflight và production smoke. Focused test chỉ chứng minh đúng cụm đó; số lịch sử hoặc script có skip không được dùng làm release approval.

## Evidence hiện tại

Evidence current-head ngày 14/07/2026:

| Khu vực | Kết quả |
|---|---|
| Backend | CI current-head pass 141 suite / 1043 test cùng Prisma validate/generate, typecheck, lint và build. |
| Database | Repository và Supabase production có đủ 35 migration forward. Fresh PostGIS+pgvector CI và Railway migrator đều pass; đã kiểm RLS, Broadcast private, split Storage và bỏ anonymous public-object listing. |
| Mobile Flutter | Mobile CI current-head pass đủ 352 test; vẫn cần evidence thiết bị Android/iOS production. |
| Web | Typecheck/lint/build current-head và deployment Vercel đều pass; health/login canonical trả 200, không request tunnel/localhost hay console error. |
| Browser E2E | Docker E2E isolated current-head pass 204/204 trong 5.8 phút. Workflow remote xanh nhưng chưa chứng minh GPS production Railway/Supabase. |
| FCM | Local contract pass: 4 backend notification suite / 40 test và 14 Flutter lifecycle/presentation test. Chưa gửi live: cần project credential production và controlled device token. |

### Docker E2E và RAG theo current source — 13/07/2026

Phần này giữ evidence local ngày 13/07/2026: lúc đó repository có 34 migration, seed disposable tạo 50 restaurant, 50 driver, 100 customer và 500 historical order; worker riêng index 402 RAG document và để embedding pending khi không có DeepSeek key. Trạng thái migration đã được evidence 14/07 phía trên thay thế: fresh CI và Supabase production hiện có đủ 35 migration forward, gồm FCM registration revocation và bỏ anonymous public-object listing. Dòng migration zero-step rolled back lịch sử vẫn là audit history, không phải thay đổi production chưa apply.

Worker current-source index 402 RAG document sau fresh seed. Không có DeepSeek key nên embedding vẫn pending và không có vector giả. Volume tái sử dụng cũ còn 44 FAQ và 8 policy row có source ID rỗng từ lần local cũ; các dòng lịch sử này không tính vào evidence worker hiện tại. Không dữ liệu nào ở đây là production hoặc phê duyệt embedding/provider production.

Image API/Admin/Restaurant của lượt lịch sử đã pass ma trận ba project; E2E remote current-head sau đó pass 204/204 trong 5.8 phút. Coverage gồm axe serious/critical, auth/refresh/RBAC, customer order qua API, hội tụ trạng thái REST, tenant isolation, map, contract, visual structure, responsive navigation và Restaurant form-login/reload persistence. Provenance registry immutable current-head vẫn là gate riêng.

Remote CI hiện đã xanh, nhưng provider-backed Railway/Supabase production smoke và live FCM bằng controlled device vẫn bắt buộc.

### Database runtime evidence lịch sử 13/07/2026

Container PostGIS + pgvector dùng một lần trước đây đã apply đủ 33 migration đang được track khi đó, xác minh PostGIS, vector, `rag_documents`, source/content index và cosine HNSW index. Lệnh `db:big-seed` tạo thật trong DB này 50 restaurant đã duyệt, 50 driver, 100 customer, 509 order, 123 review và 10 promotion; đây là bằng chứng generator ghi database, không phải fixture fix cứng lúc runtime. Worker local đồng bộ 32 document restaurant/menu sống; do chưa có DeepSeek key nên cả 32 ở trạng thái chờ embedding, không sinh vector giả. Migration FCM-revocation thứ 34 chưa có trong lượt evidence lịch sử này.

Lượt lịch sử này có trước trạng thái migration hiện tại. Supabase production nay có đủ 35 migration forward; users, restaurants, orders, driver profiles và RAG documents vẫn bằng 0 vì không chạy demo/big seed. Production chủ ý đang trống, không có tuyên bố đã có big data.

Evidence web/browser/container rộng hơn được giữ trong [release report](batch4-release-report.md). Ma trận remote current-head hiện đã thay kết quả image cũ 128/134. Provider-backed production smoke và controlled FCM delivery vẫn bắt buộc; phải chạy lại remote CI nếu release head thay đổi.

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
