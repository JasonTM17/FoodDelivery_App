# Hướng dẫn kiểm thử FoodFlow

## Quy tắc release

Chỉ được coi là xanh khi final source head pass toàn bộ local gate, remote CI mới, provider preflight và production smoke. Focused test chỉ chứng minh đúng cụm đó; số lịch sử hoặc script có skip không được dùng làm release approval.

## Ranh giới evidence — production 16/07/2026 và local lịch sử 14/07/2026

Evidence production hiện tại gắn với runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`. Các gate GitHub và provider smoke hiện tại đã chạy lại cho SHA này; test count local cũ bên dưới vẫn chỉ là evidence lịch sử có phạm vi, không phải phê duyệt production end-to-end.

| Khu vực        | Kết quả                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend        | Tại runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`, CI, E2E, Integration Smoke, security, SBOM, build, runtime smoke đa kiến trúc và tám lượt scan image đều xanh. Con số 145 suite / 1071 test vẫn là evidence local cũ của `f2c02ed`, không phải count hiện tại. |
| Database       | `prisma migrate status` live báo đủ 41 migration trong repository đã apply, không còn migration chờ. Readiness của database, Redis và Supabase Storage đều pass. Các record rolled-back/checksum provenance lịch sử được ghi riêng như audit history. |
| Mobile Flutter | Evidence local lịch sử pass 369 test và `flutter analyze`. Background location Android/iOS thật và evidence thiết bị production vẫn chưa được chứng nhận. |
| Web            | Typecheck/lint, Vitest và production-build count local lịch sử chỉ là evidence có phạm vi. Health Admin/Restaurant và sáu route đăng nhập theo locale đã được verify tại SHA `a703ece`. |
| Browser E2E    | Evidence Playwright volume sạch lịch sử pass 204/204 trên Chrome desktop, Firefox và Chrome mobile Pixel 5. Các count này chưa được chạy lại trên deployment production. |
| FCM            | Notification backend và lifecycle Flutter local lịch sử đã pass. Live delivery tới controlled production device vẫn chưa được chứng nhận. |
| Production     | Railway migrate `49579ce7-9808-4a35-afcc-82432943bc70`, API `9c823cd9-290a-4eb0-94a2-fdf01c3f0b06` và worker `413dedcc-6ba7-46be-8c99-901f592c558f` thành công tại SHA `a703ece`. Vercel Admin `dpl_7CFZKPxtNsYeF1Y6BZmnoJEoXyiF` và Restaurant `dpl_6jqguNYtbVCMVaQ6GvikiceYVsGN` trả cùng revision. Public login `vi/en/ja` và smoke GPS/Broadcast/PostGIS có xác thực đều pass; browser journey đầy đủ của customer/restaurant vẫn chưa được chứng nhận. |

### Docker volume sạch lịch sử — 14/07/2026

Project Docker volume sạch rebuild `foodflow-batch4-e2e` đã apply 38 migration hiện hành lúc đó, sau đó seed 201 user, 50 restaurant, 352 menu item, 509 order và 123 review; worker index 402 RAG document. Với local URL tường minh, stack lịch sử pass Chrome desktop 68/68, Firefox 68/68 và Chrome mobile Pixel 5 68/68: tổng 204/204, không fail hay skip. Đây là kết quả local ngày 14/07/2026, không phải test production của SHA `17584153`. FCM live và role journey production có xác thực vẫn chưa verify.

### Ranh giới môi trường build web

Build web root cố ý yêu cầu public runtime URL dùng cho metadata và API client, không được tự đoán host. Build trần sẽ fail khi thiếu `NEXT_PUBLIC_ADMIN_URL` hoặc giá trị Restaurant tương ứng. Khi build local, bắt đầu từ [`apps/admin/.env.example`](../web/apps/admin/.env.example) và [`apps/restaurant/.env.example`](../web/apps/restaurant/.env.example), chỉ dùng giá trị local không chứa secret; public value production nằm trong deployment provider. Docker Compose truyền các giá trị đó qua build argument.

### Docker E2E và RAG lịch sử — 13/07/2026

Phần này giữ evidence local ngày 13/07/2026: lúc đó repository có 34 migration hiện hành, seed disposable tạo 50 restaurant, 50 driver, 100 customer và 500 historical order; worker riêng index 402 RAG document và để embedding pending khi không có DeepSeek key. Một record provider bên ngoài có ngày ghi 36 migration, nhưng không phải chứng minh provider hiện tại. Dòng migration zero-step rolled back lịch sử vẫn là audit history, không phải thay đổi production chưa apply.

Worker clean-volume mới cũng index 402 RAG document sau fresh seed. Không có DeepSeek key nên embedding vẫn pending và không có vector giả. Volume tái sử dụng cũ còn 44 FAQ và 8 policy row có source ID rỗng từ lần local cũ; các dòng lịch sử này không tính vào evidence worker hiện tại. Không dữ liệu nào ở đây là production hoặc phê duyệt embedding/provider production.

Image API/Admin/Restaurant của lượt lịch sử đã pass ma trận ba project; E2E clean-volume current-source mới nhất pass 204/204 trong 353 giây. Coverage gồm axe serious/critical, auth/refresh/RBAC, customer order qua API, hội tụ trạng thái REST, tenant isolation, map, contract, visual structure, responsive navigation và Restaurant form-login/reload persistence. Provenance registry immutable current-head vẫn là gate riêng.

Production smoke Railway/Supabase có xác thực và FCM live tới thiết bị kiểm soát vẫn bắt buộc. Chỉ cấu hình/test FCM/SMTP/Twilio/SePay/DeepSeek/owned routing khi feature đó thuộc phạm vi chứng nhận; thiếu Google/OSRM phải trả routing 503 đúng contract, không được làm hệ thống mất startup.

### Database runtime evidence lịch sử 13/07/2026

Container PostGIS + pgvector dùng một lần trước đây đã apply đủ 33 migration đang được track khi đó, xác minh PostGIS, vector, `rag_documents`, source/content index và cosine HNSW index. Lệnh `db:big-seed` tạo thật trong DB này 50 restaurant đã duyệt, 50 driver, 100 customer, 509 order, 123 review và 10 promotion; đây là bằng chứng generator ghi database, không phải fixture fix cứng lúc runtime. Worker local đồng bộ 32 document restaurant/menu sống; do chưa có DeepSeek key nên cả 32 ở trạng thái chờ embedding, không sinh vector giả. Migration FCM-revocation thứ 34 chưa có trong lượt evidence lịch sử này.

Lượt lịch sử này có trước trạng thái migration hiện tại. Supabase production đã apply và checksum-verify đủ 36 migration. Seed local nêu ở đây không phải dữ liệu production và không được dùng để suy ra nội dung production.

Evidence web/browser/container rộng hơn được giữ trong [release report](batch4-release-report.md). Ma trận clean-volume current-source mới thay kết quả image cũ 128/134. Provider-backed production smoke và controlled FCM delivery vẫn bắt buộc; phải chạy lại evidence phù hợp nếu release head thay đổi.

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

Test web/mobile: không hardcoded camera/polyline/ETA, bỏ event stale/wrong-order/wrong-phase, chuyển pickup/dropoff đúng state, localized unavailable state, key thật bị giới hạn. Production dùng `post-deploy-smoke.ps1 -RequireAuthenticatedChecks -RequireRoutePolyline` với đủ token smoke scoped và active order authorized. Public-only phải truyền rõ `-AllowUnauthenticatedOnly` và không phải chứng nhận release.

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
