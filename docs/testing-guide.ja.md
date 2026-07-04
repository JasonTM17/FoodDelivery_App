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
最新の current-head map/tracking evidence: 2026-07-04 `3252c6a` で、backend `pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm lint`、full `pnpm test` (106 suites / 752 tests)、focused `route-utils.spec.ts` (11 tests)、`pnpm build` はすべて pass。Admin driver map realtime は `pnpm --filter foodflow-admin test` (34 files / 139 tests)、`pnpm --filter foodflow-admin typecheck`、`pnpm --filter foodflow-admin lint`、web `pnpm install --frozen-lockfile`、`pnpm --filter foodflow-admin build` が pass。Mobile customer/driver maps は marker、telemetry trail、route polyline、Google Maps directions を処理する前に共通の Vietnam delivery coordinate guard を使います。Focused map/route Flutter tests は 14/14 pass、`flutter analyze` は issue 0、full `flutter test` は 143 tests pass。
最新の current-head Restaurant web evidence: 2026-07-04 `2cd87e5` で、`pnpm --filter restaurant typecheck`、`pnpm --filter restaurant lint`、`pnpm --filter restaurant test` (27 files / 79 tests)、`pnpm --filter restaurant build` がすべて pass。Production build は localized `vi`、`en`、`ja` routes と `/api/healthz` を生成しました。
最新の current-head backend/web gate evidence: 2026-07-04 `03ffed4` で、backend `pnpm audit`、`pnpm install --frozen-lockfile`、`pnpm prisma generate`、`pnpm typecheck`、`pnpm lint`、full `pnpm test` (106 suites / 752 tests)、`pnpm build` は dependency advisory patch 後にすべて pass。Web workspace は Next 15 / next-intl 4 security migration 後に `pnpm audit --audit-level moderate`、`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm lint`、`pnpm test` (Admin 34 files / 139 tests; Restaurant 27 files / 79 tests)、`pnpm build` がすべて pass。Admin build は `vi`、`en`、`ja` 向けに 70 localized pages、Restaurant build は 55 localized pages を生成しました。

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

最新の local E2E evidence: 2026-07-04 `14268da` / `codex/batch4-integration` で、Docker Compose は `NEXT_PUBLIC_API_URL` を image build time に渡した healthy な Backend/Admin/Restaurant standalone containers を使いました。Local machine では別 process が `127.0.0.1:3000` を使用していたため、verified run は IPv6 loopback endpoints を明示しました: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`。`pnpm test:e2e --project=chromium` は 35/35 tests pass、`pnpm test:e2e --project=firefox` も 35/35 tests pass し、axe serious/critical smoke、visual contract、admin driver map navigation、tracking endpoint availability、tenant isolation coverage を含みます。

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
最新の local mobile evidence: 2026-07-04 / `codex/batch4-integration` で、`flutter pub get --enforce-lockfile` は pass、focused map/route tests は 14/14 pass (`directions_uri_test.dart`, `trip_route_provider_test.dart`, `encoded_polyline_test.dart`, `tracking_provider_test.dart`, `lat_lng_validation_test.dart`)、`flutter analyze` は issue 0、full `flutter test` は 143 tests pass。Android/iOS Flutter platform scaffold は追加済みで、Android debug APK build は `flutter build apk --debug -t lib/main_customer.dart` と `flutter build apk --debug -t lib/main_driver.dart` の両方が pass。Native Google Maps key は env/local xcconfig のみから読み、Android release signing は `FOODFLOW_UPLOAD_*` secrets が揃うまで fail-closed です。同じ map/tracking cluster で backend route integrity gates も local pass 済みです: `pnpm typecheck`、`pnpm lint`、full `pnpm test` (106 suites、752 tests)、focused `route-utils.spec.ts`、`pnpm build`。

Remote CI は `e776f5c` が last fully green です: Gitleaks `28704171253`、Lint `28704171260`、Build Check `28704171258`、SBOM `28704171266`、Trivy `28704171279`、CodeQL `28704171259`、CI `28704171265`、E2E Tests `28704171252`、Integration Smoke Gate `28704171294`。その後の head（最新 Batch 4 local commits を含む）は GitHub Actions account billing/spending-limit または token/auth blocker により remote jobs が start/complete できませんでした。Billing/auth 修正後、Mobile CI、CI、Build Check、Lint、Gitleaks、CodeQL、Trivy、SBOM、E2E Tests、Integration Smoke Gate を rerun してください。

## Security checks

```bash
git diff --check
git diff --cached --check
```

Staged と tracked-file の secret scan を実行します。`.env.example` の placeholder は許可しますが、real token、private key、database credential、service-role secret は block します。
