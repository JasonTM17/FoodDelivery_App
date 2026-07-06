# FoodFlow テストガイド

Languages: [English](testing-guide.md) | [Tiếng Việt](testing-guide.vi.md) | [日本語](testing-guide.ja.md)

## Backend

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused examples:

```bash
pnpm test -- sepay.provider.spec.ts payments.service.spec.ts
pnpm test -- ai-chat.service.spec.ts deepseek-chat-provider.service.spec.ts ai-chat.controller.spec.ts
pnpm test -- restaurant-revenue.service.spec.ts
```

Backend tests は real behavior を証明する必要があります。runtime mock payment、fabricated AI answer、random business value、tenant scope の欠落を許可しません。

Backend coverage threshold は `backend/jest.config.ts` で管理します。Shell ごとに quoting が異なるため、JSON threshold を CLI 引数で渡さないでください。

### AI scenario smoke gate

`pnpm db:big-seed` は `customer1@foodflow.vn` 向けに deterministic な AI smoke order `FF-001`, `FF-002`, `FF-003`, `FF-004`, `FF-006`, `FF-007`, `FF-008`, `FF-009`, `FF-010` を作成します。Integration workflow は `/api/auth/login` でログインし、認証済み `/api/ai/chat` に対して `e2e/ai-scenarios/run-ai-scenarios.ts` を実行します。

LLM provider secret がない CI では `AI_ALLOW_DEGRADED=true` を使えます。この場合も auth、tool grounding、tenant-scoped order lookup、support-ticket escalation、hallucination guard は検証します。Release verification では degraded mode を使わず、secret manager から rotate 済みで有効な `DEEPSEEK_API_KEY` を設定して実行してください。

## Web

```bash
cd web
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused dashboard checks:

```bash
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build

pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
```

最新の local web/API-contract evidence: 2026-07-04 `codex/batch4-integration` で、OpenAPI YAML parse は 137 paths で pass し、local web endpoint coverage scanner は `MISSING_ENDPOINTS=0` を報告しました。Web workspace 全体で `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` が pass。Vitest は Admin 34 files / 137 tests、Restaurant 27 files / 79 tests が pass。Backend はこの contract cluster で `pnpm typecheck`、`pnpm lint`、targeted Jest (`admin-resources.service.spec.ts`, `admin.heatmap.spec.ts`: 2 suites / 9 tests) が pass しました。
以前の map/tracking evidence at `3252c6a` は履歴として有用ですが、current-head verification matrix は 2026-07-06 の [Batch 4 release report](batch4-release-report.md) を参照してください。
最新の current-head Restaurant web evidence: 2026-07-04 `2cd87e5` で、`pnpm --filter restaurant typecheck`、`pnpm --filter restaurant lint`、`pnpm --filter restaurant test` (27 files / 79 tests)、`pnpm --filter restaurant build` がすべて pass。Production build は localized `vi`、`en`、`ja` routes と `/api/healthz` を生成しました。
最新の current-head backend/web gate evidence: 2026-07-04 `ad3b730` 後に、backend `pnpm install --frozen-lockfile`、`pnpm prisma generate`、`pnpm typecheck`、`pnpm lint`、full `pnpm test` (106 suites / 752 tests)、`pnpm build` はすべて pass。Web workspace は `pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm lint`、`pnpm test` (Admin 34 files / 139 tests; Restaurant 27 files / 79 tests)、`pnpm build` がすべて pass。Admin build は `vi`、`en`、`ja` 向けに 70 localized pages、Restaurant build は 55 localized pages を生成しました。この head の remote CI/Actions evidence は account token/auth が無効なため pending です。

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

最新の local E2E evidence: 2026-07-06 `33e90ea` で、Docker Compose は `NEXT_PUBLIC_API_URL` を image build time に渡した healthy な Backend/Admin/Restaurant standalone containers を rebuild しました。Local machine では別 process が `127.0.0.1:3000` を使用していたため、verified run は IPv6 loopback endpoints を明示しました: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`。Chromium + Firefox は 70/70 tests pass し、axe serious/critical smoke、visual contract、admin driver map navigation、tracking endpoint availability、realtime status flows、tenant isolation coverage を含みます。E2E harness は local route が Next.js 404 shell に解決された場合に fail-fast します。

Batch 4 E2E は login/RBAC、locale routes、WebSocket order feed、promotion CRUD、support flow、exports、menu、revenue、staff、insights、notifications、tenant isolation を含めます。`web/e2e/tests/tenant-isolation.spec.ts` は、restaurant user が別 restaurant tenant の order を list/read/update できないことを検証します。

Realtime security regression では次も確認します。

- Token なし、refresh token、期限切れ token、不正署名では Socket.IO に接続できない。
- Admin 以外は Admin order/driver room に join できない。
- Restaurant は別 tenant の room に join できない。
- Customer、driver、restaurant staff は無関係な order room に join できない。
- 認証済み driver account のみ GPS update を送信できる。
- Mobile は driver GPS metadata を publish 前に normalize します。Geolocator speed は m/s から backend km/h contract に変換し、invalid な heading/speed/accuracy は送信しません。
- Driver/customer maps は backend `routePolyline` と raw telemetry trail を別々に描画する必要があります。
- Route deviation check は vertex だけでなく接続された polyline segment に snap し、provider polyline が疎でも driver を誤って off-route 判定しないこと。
- Order が pickup phase から dropoff phase に変わる時、client が pickup 後に stale restaurant-bound route を描画しないよう route geometry を clear します。
- Google/OSRM route provider が使えない場合、tracking は `etaMinutes: null` と `source: route_unavailable` を返します。Backend は straight-line ETA minutes を捏造してはいけません。
- Admin driver map は realtime が `orderId: null` を送った時に stale `currentOrder` を clear し、invalid realtime coordinates を Google Maps に渡す前に無視すること。
- Mobile driver の「Open directions」は、利用可能なら現在の driver coordinates を Google Maps `origin` として渡し、navigation mode を使い、invalid destination では明示的な unavailable state を表示すること。
- Mobile driver route replay と demand heatmap は、backend route/demand coordinates から real Google Maps overlays で render します。schematic canvas-only map や local generated points に置き換えてはいけません。
- Notification client は別 user として subscribe または mutation できない。
- Dispatch offer room と accept/reject は認証済み driver ID に紐付く。
- Admin/Restaurant web client は reconnect 時に最新 access token を送信する。

## Accessibility and visual QA

- Axe serious/critical issue は 0。
- Keyboard navigation、visible focus、dialog focus trap、chart/table alternatives を確認。
- Playwright suite で `web/e2e/tests/visual-contract.spec.ts` を実行する。Admin/Restaurant の FoodFlow login brand shell、responsive centering、SVG logo token、CTA contrast を検証し、review 用 screenshot を Playwright `test-results` に保存する。
- Approved Stitch baseline と比較。
- この repo には approved Stitch bitmap baseline はまだ保存されていない。review 済み Stitch export を追加してから pixel `toHaveScreenshot` snapshot に置き換える。
- Desktop 1440/1280、tablet、mobile を確認。

## Mobile

Mobile reconciliation は web/backend Batch 4 が安定した後に行います。

```bash
cd mobile
flutter pub get
flutter pub get --enforce-lockfile
flutter analyze
flutter test
```

Mobile API client は安定済みの Batch 4 OpenAPI contract を使います。
Batch 4 mobile gate は frozen install、`flutter analyze` issue 0、Flutter test suite 全体の pass、customer と driver 両方の Android debug APK compile を必須にします。
最新の local mobile evidence: 2026-07-06 `33e90ea`。`flutter pub get --enforce-lockfile` は pass、`flutter analyze` は issue 0、full `flutter test` は 224 tests pass、focused tracking/driver route/heatmap tests は 22/22 pass、`flutter build apk --debug` は `build/app/outputs/flutter-apk/app-debug.apk` を生成しました。APK build には `share_plus` の Kotlin Gradle Plugin future-compatibility warning のみが出ており、fail はしていません。Native Google Maps key は env/local xcconfig のみから読み、Android release signing は `FOODFLOW_UPLOAD_*` secrets が揃うまで fail-closed です。

Remote CI は `e776f5c` が last fully green です: Gitleaks `28704171253`、Lint `28704171260`、Build Check `28704171258`、SBOM `28704171266`、Trivy `28704171279`、CodeQL `28704171259`、CI `28704171265`、E2E Tests `28704171252`、Integration Smoke Gate `28704171294`。その後の head（最新 Batch 4 local commits を含む）は GitHub Actions account billing/spending-limit または token/auth blocker により remote jobs が start/complete できませんでした。Billing/auth 修正後、Mobile CI、CI、Build Check、Lint、Gitleaks、CodeQL、Trivy、SBOM、E2E Tests、Integration Smoke Gate を rerun してください。

## 最新 local evidence (2026-07-06)

Verified code head は docs-only refresh 前の `33e90ea` on `origin/master` です。Remote `codex/batch4-integration` は削除済みです。Clean local worktree は local `codex/batch4-integration` を使っていますが、`origin/master` を tracking しています。GitHub token/auth/billing が未解決のため、remote CI/Actions は pending です。

- Backend と web の frozen install は pinned `pnpm 11.7.0` で pass。Mobile `flutter pub get --enforce-lockfile` も pass。
- Backend は test `DATABASE_URL`/`DIRECT_URL` で Prisma validate、`pnpm typecheck`、`pnpm lint`、full `pnpm test`（110 suites / 795 tests）、`pnpm build` が pass。
- Web は `pnpm typecheck`、`pnpm lint`、full Vitest（Admin 37 files / 153 tests、Restaurant 31 files / 100 tests）、`pnpm build`（Admin 70 localized pages、Restaurant 55 localized pages）が pass。
- Docker Compose は current source から Backend/Admin/Restaurant images を frozen install で rebuild。rebuild 後に `http://[::1]:3001/api/healthz`、`http://[::1]:3000/api/healthz`、`http://[::1]:3002/api/healthz` の health check が pass。
- Playwright は IPv6 loopback URL で Chromium + Firefox together 70/70 tests が pass。axe serious/critical smoke、visual contract、admin driver map navigation、tracking endpoint availability、realtime status flows、tenant isolation を含みます。
- Mobile は `flutter pub get --enforce-lockfile`、`flutter analyze`、full `flutter test`（224 tests）、focused tracking/driver route/heatmap tests（22/22）、`flutter build apk --debug` が pass。
- Tracking contract refresh は backend `pnpm exec jest src/tracking --runInBand`（5 suites / 41 tests）と focused dispatch/tracking regression tests（2 suites / 16 tests）を pass。OpenAPI YAML parse は以前 137 paths と `OrderTrackingResponse.routePhase` required で pass 済みです。
- Dispatch/map evidence: restaurant acceptance は restaurant latitude/longitude と attempt metadata を含む route-aware dispatch jobs を enqueue します。Worker は legacy malformed jobs を skip し、ioredis `GEOSEARCH WITHDIST` tuple rows を parse し、`raw[i].replace is not a function` で fail しません。Customer `driver:assigned` event は `etaMinutes: null` を返すため、tracking が Google/OSRM route を得る前に speed-based ETA を捏造しません。
- Security evidence: high-confidence tracked secret scan は match なし。`.env.example` 以外の tracked dotenv/key/credential files はありません。Native Firebase/provisioning artifacts は ignore 済み。Legacy fake refund processor は削除済み。Refund は `payment-refund` に enqueue され、full refund は SePay または wallet ledger reversal 成功後のみ反映されます。Mobile idempotency key は UUID v4、mobile HTTP body logging は debug-only かつ redacted です。

## Security checks

```bash
git diff --check
git diff --cached --check
```

Staged と tracked-file の secret scan を実行します。`.env.example` の placeholder は許可しますが、real token、private key、database credential、service-role secret は block します。
