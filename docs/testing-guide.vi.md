# Hướng dẫn kiểm thử FoodFlow

## Quy tắc release

Chỉ được coi là xanh khi final source head pass toàn bộ local gate, remote CI mới, provider preflight và production smoke. Focused test chỉ chứng minh đúng cụm đó; số lịch sử hoặc script có skip không được dùng làm release approval.

## Evidence hiện tại

Scoped hardening evidence ngày 13/07/2026:

| Khu vực | Kết quả |
|---|---|
| Backend | 135 suite / 1008 test, Prisma validate/generate, typecheck, lint và build đều pass sau fix notification idempotency và SMTP escaping. |
| Database | DB PostGIS + pgvector trống apply 32/32 migration; Supabase production cũng báo đủ 32 migration. |
| Driver Flutter | Flutter analyze pass. Full 325 test pass trước availability-race patch cuối; 4 test session/race focused pass sau patch. Compiler Windows treo trước khi chạy test sau cache clean nên vẫn cần full final rerun. |
| Web | Admin 192 test, Restaurant 130 test, workspace typecheck/lint và hai production build đều pass với Vercel production env. |
| Browser E2E | 128/134 check pass trên Docker image cũ. 6 check còn lại cần image navigation hiện tại và DB test isolated có seed; không phải current-source release proof. |
| FCM live send | Chưa chạy: cần project credential production và controlled device token. |

### Database runtime evidence 13/07/2026

Container PostGIS + pgvector trống đã apply đủ 32 migration và xác minh PostGIS, vector, bảng `rag_documents` cùng cosine HNSW index. Supabase production đã apply cùng migration RAG đã commit, checksum khớp và Prisma báo schema up to date. Row count production của users, restaurants, orders, driver profiles và RAG documents đều bằng 0; không chạy demo/big seed trên production.

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
