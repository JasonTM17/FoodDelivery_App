# FoodFlow Testing Guide

## Release rule

A release is green only when the final source head passes every required local gate, fresh remote CI, provider preflight, and production smoke. A focused test proves only its bounded change. Historical counts and partially skipped scripts must never be presented as current full-release approval.

## Evidence boundary — production 2026-07-15 and historical local 2026-07-14

Current production health evidence is tied to runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`. Test counts below are explicitly historical local evidence from earlier heads; the authenticated Admin/Restaurant Chrome and Customer/Driver API role smoke belongs to SHA `17584153`, not current-revision certification.

| Area           | Result                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend        | Post-merge candidate: Prisma generate/validate, typecheck, ESLint, and Nest build pass; full Jest reports 153 passing suites, one gated integration suite skipped, 1,160 passing tests, and one skipped test. |
| Database       | Deployed SHA `a703ece` has 41 applied migrations and passing Database/Redis/Supabase Storage readiness. Candidate migration 42 is validated only on disposable PostGIS and remains undeployed pending PR review and synchronized rollout. Historical rolled-back/checksum-provenance rows remain separately documented audit history. |
| Mobile Flutter | Post-merge lock resolution and analyze pass with no issues; the full Customer/Driver suite passes 373 tests. Real physical-device Android/iOS background-location remains uncertified. |
| Web            | Post-merge frozen install, typecheck, lint, and Vercel build-selection tests pass. Admin passes 194 tests and builds 70 routes; Restaurant passes 135 tests and builds 55 routes. Current deployed health is verified separately at SHA `a703ece`. |
| Browser E2E    | Historical clean-volume Playwright evidence passed 204/204 across Chrome desktop, Firefox, and Pixel 5 mobile Chrome. Those counts were not rerun against the production deployment. |
| FCM            | Historical local notification and Flutter lifecycle tests passed. Live delivery to a controlled production device remains uncertified. |
| Production     | Railway migrate `49579ce7-9808-4a35-afcc-82432943bc70`, API `9c823cd9-290a-4eb0-94a2-fdf01c3f0b06`, and worker `413dedcc-6ba7-46be-8c99-901f592c558f` are successful at SHA `a703ece`; API/ready and both web health routes report the same revision. Restaurant health required authenticated Vercel CLI access because project SSO protection redirects public requests. Current-revision authenticated role journeys and public Restaurant access remain uncertified. |

### Historical fresh clean-volume Docker details — 2026-07-14

The rebuilt clean-volume Docker project `foodflow-batch4-e2e` applied its then-current 38 migrations, then seeded 201 users, 50 restaurants, 352 menu items, 509 orders, and 123 reviews. Its worker indexed 402 RAG documents. With explicit local URLs, that historical stack passed Chrome desktop 68/68, Firefox 68/68, and Pixel 5 mobile Chrome 68/68: 204/204 with no failed or skipped cases. These are local 2026-07-14 results, not SHA `17584153` production tests. Live FCM and authenticated production journeys remain unverified.

### Web build environment boundary

The root web build deliberately requires the public runtime URLs used for metadata and API clients. It must not silently fall back to a guessed host: a bare build fails when `NEXT_PUBLIC_ADMIN_URL` or the corresponding Restaurant value is absent. For local builds, start from [`apps/admin/.env.example`](../web/apps/admin/.env.example) and [`apps/restaurant/.env.example`](../web/apps/restaurant/.env.example), use only local non-secret values, and keep production public values in the deployment provider. Docker Compose supplies the values through its build arguments.

### Historical 2026-07-13 Docker E2E and RAG evidence

This section preserves the 2026-07-13 local run. It tracked the then-current 34 migrations and used disposable seed data: 50 restaurants, 50 drivers, 100 customers, and 500 historical orders. The dedicated worker indexed 402 RAG documents and left embeddings pending without a DeepSeek key. A later dated external record reported 36 Supabase migrations; it is not current provider proof. The historical rolled-back zero-step migration row remains audit history, not an unapplied production change.

The newer clean-volume worker also indexed 402 RAG documents after its fresh seed. No DeepSeek key was configured, so embeddings remained pending and no fake vectors were used. The old reused volume also contained 44 FAQ and 8 policy rows with null source IDs from an older local run; those historical rows are excluded from current-worker evidence. None of this represents production data or production embedding/provider approval.

The rebuilt API/Admin/Restaurant images passed that historical three-project matrix. The later fresh clean-volume E2E reported 204 expected, 0 unexpected, 0 flaky, and 0 skipped in 353316 ms. Coverage includes axe serious/critical checks, auth/refresh/RBAC, customer API orders, REST-observed status convergence, tenant isolation, maps, contracts, visual structure, responsive navigation, and Restaurant form-login/reload persistence. Immutable registry provenance remains a separate release gate.

Authenticated Railway/Supabase production smoke and a controlled live FCM delivery remain mandatory. Optional FCM/SMTP/Twilio/SePay/DeepSeek/owned-routing integrations must be configured and tested only when included in the certified feature set; missing Google/OSRM produces the expected routing 503 rather than blocking startup.

### Historical 2026-07-13 database runtime evidence

An isolated local PostGIS + pgvector container previously applied all 33 then-tracked migrations and verified PostGIS, vector, `rag_documents`, source/content indexes, and the cosine HNSW index. Its disposable `db:big-seed` run produced 50 approved restaurants, 50 drivers, 100 customers, 509 orders, 123 reviews, and 10 promotions, proving the generator is database-backed rather than a runtime hard-coded fixture. The local worker then synchronized 32 live restaurant/menu documents; with no DeepSeek key, all 32 correctly remained pending without fake embeddings. The 34th FCM-revocation migration was later applied to a separate fresh database, not this historical evidence run.

This historical run predates the local 36-migration evidence. A dated external record reports 36 checksum-verified Supabase migrations, but the local seed data described here is not production data and must not be used to infer production contents.

Earlier broader web/browser/container evidence is retained in the [release report](batch4-release-report.md). The fresh clean-volume current-source matrix supersedes the old 128/134 image result. Provider-backed production smoke and controlled FCM delivery remain required; rerun the relevant evidence if the release head changes.

### 2026-07-12 focused Driver GPS E2E evidence

This is bounded local evidence, not release approval:

- Full Flutter analyze and all 312 Flutter tests passed after making GPS mutations use the authenticated REST command path, adding Android notification-permission coverage, and redacting precise coordinates from debug request logs.
- `lib/main_driver.dart` built as the Android `driver` debug flavor, then ran on an Android API 35 emulator.
- The Driver's explicit Online action prompted for notification permission; once allowed, Android reported a running location foreground service.
- A simulated GPS update was accepted by the local E2E API, refreshed Redis liveness, reached PostGIS within seconds, and produced exactly one event for an authorized Admin Socket.IO subscriber.
- This uses the explicit local `socketio` provider. It does not prove Supabase Broadcast, Railway, Vercel, or production device behavior.

### 2026-07-15 authenticated production Android emulator evidence

This smoke used an Android API 35 x86_64 emulator, a Driver debug APK, a temporary synthetic Driver, the deployed Railway API, and the linked Supabase project. It did not use a personal account or real coordinates.

- Denying location left Driver Offline and did not start a foreground service. Granting precise while-in-use location plus notifications allowed the explicit Online action; Android reported the Geolocator service in foreground mode with the location service type.
- With the emulator screen asleep, simulated movement produced accepted API updates and advanced PostGIS history from 3 to 5 rows.
- During airplane mode, the app logged bounded GPS buffering without an API update. Restoring connectivity flushed two samples with their original timestamps and advanced PostGIS from 5 to 7 rows.
- After an unexpected process termination, relaunch refreshed the expired access token, revalidated the session/KYC state, called `/driver/online`, resumed location submission, and restored the Android location foreground service. Regression tests cover the former ghost-Online failure path.
- A separate authenticated production smoke subscribed a temporary Admin to its authorized private Supabase channel, submitted a valid Driver GPS sample, received the Broadcast event, and confirmed PostGIS persistence. The Driver could not subscribe to the Admin channel.
- Cleanup removed the temporary profile and all production GPS rows; post-clean counts were zero. The app was cleared/uninstalled and the emulator stopped.

This proves the Railway/Supabase path and Android API 35 emulator behavior. Android 10/12, approximate/background-permission variants, physical Android, physical iOS, app-store builds, and controlled FCM delivery remain unverified in this Windows environment.

## One-command local gate

With production env/auth configured and a seeded browser stack available:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass \
  -File infra/scripts/local-release-gate.ps1 -RunE2E
```

The script checks clean git/diffs, tracked/staged secrets, frozen installs, Prisma, backend, web, OpenAPI, Compose, mobile, optional E2E, Supabase preflight, and Vercel preflight.

Development-only partial runs must use explicit skip flags and be labeled partial:

```powershell
powershell -File infra/scripts/local-release-gate.ps1 \
  -AllowDirty -SkipInstall -SkipBuild -SkipDeployPreflight
```

## Backend gate

```powershell
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
$env:DATABASE_URL='postgresql://foodflow:foodflow_dev@localhost:5432/foodflow'
$env:DIRECT_URL=$env:DATABASE_URL
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm exec jest --runInBand
corepack pnpm build
Remove-Item Env:DATABASE_URL,Env:DIRECT_URL
```

Fresh-migration test:

1. Start an isolated empty PostGIS database.
2. Run `prisma migrate deploy`, never `migrate dev`.
3. Confirm every migration in the checked-out final source head completes.
4. Start the API and require healthy DB/provider components.
5. Run integration/E2E against that schema.

Backend coverage must include:

- Auth access/refresh/RBAC and expired/wrong-token rejection.
- Restaurant active-profile tenant scoping.
- Order state transitions, payment/webhook replay, promotions, notifications, exports, audit/support.
- Realtime token channel authorization and RLS-oriented claims.
- Supabase Storage and PostgreSQL queue adapters plus local compatibility adapters.
- GPS freshness/bounds, route phase, dispatch retries, route geometry/ETA, and participant tracking access.
- DeepSeek provider success, timeout/error/unconfigured, session ownership, escalation, and usage telemetry.
- Production environment validation, including weak/example/local value rejection.

## OpenAPI and client contract

```powershell
npx -y @stoplight/spectral-cli lint docs/openapi.yaml \
  --ruleset docs/openapi/.spectral.yaml --fail-severity error
```

Contract checks must prove:

- Web uses the shared success envelope and RFC 7807 errors.
- `POST /api/realtime/token` and secured job drain are documented.
- Mobile models are generated/reconciled from the canonical contract rather than a stale or hand-invented schema.
- Runtime validators reject malformed “successful” business payloads instead of rendering fake empty/zero data.

## Web gate

```powershell
cd web
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test

$env:NEXT_PUBLIC_ADMIN_URL='https://admin.foodflow.test'
$env:NEXT_PUBLIC_RESTAURANT_URL='https://restaurant.foodflow.test'
corepack pnpm --filter foodflow-admin build
corepack pnpm --filter restaurant build
Remove-Item Env:NEXT_PUBLIC_ADMIN_URL,Env:NEXT_PUBLIC_RESTAURANT_URL
```

Builds without required production public env must fail. Placeholder test domains are local build evidence only and must never be deployed.

Unit/component coverage should include response validation, loading/empty/error states, locale routing, auth refresh, tenant-safe mutations, realtime provider selection, maps/geometry, keyboard interaction, and accessible names.

## Isolated browser stack

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
```

Ports: Admin `13000`, API `13001`, Restaurant `13002`, Postgres `15432`, Redis `16379`, MinIO `19000/19001`.

Use these origins:

```powershell
$env:ADMIN_URL='http://localhost:13000'
$env:API_URL='http://localhost:13001/api'
$env:RESTAURANT_URL='http://localhost:13002'
```

`127.0.0.1` is intentionally outside this overlay's normal CORS origins and is reserved for explicit fail-closed/error-state tests.

## Playwright

```powershell
cd web
corepack pnpm test:e2e:install
corepack pnpm test:e2e:list
corepack pnpm test:e2e
```

The suite runs one worker to keep seeded state deterministic. Required coverage:

| Spec                                  | Contract                                           |
| ------------------------------------- | -------------------------------------------------- |
| `auth.spec.ts`                        | login/session/RBAC                                 |
| `admin-dashboard.spec.ts`             | Admin data and actions                             |
| `restaurant-order-management.spec.ts` | queue and status transitions                       |
| `customer-order-flow.spec.ts`         | cart/address/order end-to-end                      |
| `realtime-tracking.spec.ts`           | active order/tracking availability                 |
| `tenant-isolation.spec.ts`            | cross-restaurant read/write denial                 |
| `batch4-contract.spec.ts`             | exports, promotions, accessibility, AI fail-closed |
| `visual-contract.spec.ts`             | responsive brand/form structural contract          |

No test may silently accept a Next.js/Vercel 404 shell, console error, mixed-origin API request, or unavailable business data as a pass.

## Accessibility

Use `@axe-core/playwright` and fail on `serious` or `critical` violations. Test normal and error states in Chromium and Firefox.

Also verify manually/semantically:

- Keyboard-only order, menu, promotion, export, login, map controls.
- Visible `:focus-visible` state.
- Correct heading hierarchy, form labels, error associations, live regions, and button types.
- Contrast for validation/retry/error text.
- Locale-correct title, `html lang`, labels, and `aria-label` on fresh browser contexts.
- No focus trap or inaccessible portal/dialog.

Release requirement: axe serious/critical **0** on all agreed critical pages in both browsers, not only the two focused error-state tests.

## Visual and Stitch regression

`visual-contract.spec.ts` currently validates layout/branding and saves evidence screenshots; it is not a full pixel-baseline diff. Before release:

1. Compare current-source screenshots against approved Admin/Restaurant/Stitch artifacts.
2. Cover desktop and responsive widths for dashboard, approval, promotions, audit/export, staff, benchmark, map/tracking, and mobile flows.
3. Disable motion and use deterministic seed/time where visual baselines require it.
4. Review differences manually; do not auto-update baselines to make a failure green.
5. Regenerate docs media only after accepted UI changes.

## Maps and shipper route tests

Backend tests must validate:

- Google/routing provider response parsing, cache invalidation, and provider failure.
- Valid Vietnam/service-area coordinate bounds and encoded geometry limits.
- Fresh `sampledAt`, order/driver ownership, pickup/drop-off route phase.
- Persisted `delivery_tasks.route_geojson`, real distance/duration, and remaining ETA.
- Cross-tenant/unauthorized tracking denial.

Web/mobile tests must verify:

- No hardcoded fallback city/camera/polyline/ETA.
- Wrong-order/wrong-phase/stale events do not replace current state.
- Driver-to-pickup and pickup-to-customer routes switch only on valid status/telemetry.
- Missing data produces localized unavailable/error UI.
- Real provider key smoke is run only with an origin/package-restricted key.

Production smoke should use `post-deploy-smoke.ps1 -RequireAuthenticatedChecks -RequireRoutePolyline` with all scoped smoke tokens and an authorized active order. Public-only checks require the explicit `-AllowUnauthenticatedOnly` opt-out and are not release certification.

## Supabase Realtime and tenant tests

Required cases:

- Token TTL and claim shape; channels all begin `private:`.
- Customer receives only owned order/user channels.
- Restaurant requires active profile and exact tenant/order.
- Driver receives only self/assigned-order channels.
- Admin receives only documented admin channels plus explicitly requested order.
- Cross-tenant requests return forbidden before token issue.
- Expired/invalid JWT cannot subscribe; anon cannot subscribe to arbitrary private channels.
- An authorized server-side private Broadcast event reaches only its intended subscribed handler; cross-scope events are rejected or not delivered.
- Local Socket.IO provider remains covered separately and is never an implicit production fallback.

## AI chatbot

Local fail-closed tests run without a key and expect `AI_PROVIDER_NOT_CONFIGURED`; timeout/provider errors must terminate with the documented error event rather than a fabricated assistant reply. Live smoke requires a newly rotated `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL=deepseek-v4-flash`, and a server-side environment.

Verify answer, escalation, session ownership, order context, token usage, latency, cost telemetry, budget display, and provider timeout/error. Never accept canned/random text as proof of an LLM call.

## Mobile gate

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

Production release additionally requires:

- Supabase token/channel claims, cross-scope denial, reconnect/refresh, and receive-only event dispatch.
- Customer/driver app entry smoke.
- Maps/GPS permission denied, stale/future sample, background update, route phase, offline/reconnect.
- Driver terms/KYC private upload grants, credential-header denial, object-key submission, pending/rejected routing, and Admin signed review.
- vi/en/ja generated localization and no hardcoded business labels.
- API contract and base URL fail-closed checks.
- Android/iOS production signing and provider-key injection through secure platform config.

## Docker and supply-chain tests

- Build Backend/Migrate/Admin/Restaurant for `linux/amd64,linux/arm64`.
- Verify bcrypt, BullMQ/MessagePack native addon, Prisma engine, and Sharp PNG on both architectures.
- Verify non-root UID and health endpoint.
- Inspect multi-arch manifest, provenance, and SBOM.
- Trivy both architectures; block `HIGH,CRITICAL`.
- Actionlint and ShellCheck workflows/scripts.
- Refuse semver overwrite; compare promoted digest with SHA source.

Do not publish or promote from local evidence while remote CI is unavailable.

## Security and secret checks

```powershell
powershell -File infra/scripts/secret-scan.ps1
git diff --check
git diff --cached --check
git ls-files | Select-String -Pattern '(^|/)(\.env|.*\.(pem|key|p12|pfx))$'
```

CI must rerun Gitleaks, CodeQL, dependency audit, Trivy, and SBOM. Review generic matches; test/example values must be obviously non-live. Any real match stops release and triggers rotation/history assessment.

## Production smoke and evidence

Run [production health](../infra/scripts/production-health-check.ps1) and [authenticated post-deploy smoke](../infra/scripts/post-deploy-smoke.ps1) exactly as described in the deployment guide.

Record for each gate:

- Exact source SHA and UTC timestamp.
- Command, environment class (local/preview/production), and pass/fail.
- Test/suite count where emitted.
- Image manifest digest and per-architecture scan result.
- Production aliases and health status, never secret values or bearer tokens.
- Explicit skips/blockers.

Artifacts and reports must be gitignored unless intentionally curated under `docs/`. Never commit Playwright traces/videos containing tokens or user data.

For an empty production database, the bounded role-auth fixture procedure is documented in the deployment guide. Its evidence is narrower than full post-deploy smoke: Admin/Restaurant Chrome login and protected-route revocation, Customer/Driver read-only API auth, private Realtime channel shape, and cross-role denial. It deliberately excludes order/provider mutations. The fixture controller must prove the Railway/Supabase target identity, `postgres.public`, session/direct port `5432`, one database connection, and the same advisory-lease backend PID at every transaction boundary. Provisioning persists the run ID and immutable fixture UUIDs in a non-secret lifecycle row in the same transaction as the fixture. Cleanup must lock and revalidate ownership, delete only those UUIDs, preserve unexpected semantic dependent rows for investigation, atomically mark deletion committed, close clients, drain the Realtime JWT TTL, finalize the lifecycle row, and finish with an independent zero-row inventory. An unknown run ID remains a hard failure.

`production-role-smoke-fixture.integration.spec.ts` is a destructive database integration gate. It runs only when `PRODUCTION_ROLE_SMOKE_TEST_DATABASE_URL` points to loopback, the database name starts with `foodflow_role_smoke_`, the PostgreSQL database comment is exactly `FOODFLOW_DISPOSABLE_PRODUCTION_ROLE_SMOKE_TEST_DATABASE`, and `PRODUCTION_ROLE_SMOKE_TEST_CONFIRM=DESTROY_DISPOSABLE_LOOPBACK_FOODFLOW_DATABASE`. This server-side marker prevents a localhost tunnel from passing on URL shape alone. Teardown deletes only lifecycle-recorded/test-created UUIDs; it never truncates tables. The suite proves empty recovery refusal, wrong-run refusal while a real fixture exists, swapped-slug non-deletion, cart-by-restaurant residue blocking without user deactivation, cleanup waiting behind a shared user lock, post-delete semantic-FK rejection, durable tombstone recovery, exact UUID cleanup, zero final rows, and owner-PID lease release. Unit tests cover target URL/schema/port validation, database-marker enforcement, atomic migration structure, lease failure modes, and inactive-user Realtime signing refusal.

Privacy-reviewed screenshots may be curated only when they contain synthetic fixture labels and aggregate zero-state data. Record capture UTC, runtime revision, dimensions, SHA-256, browser channel, cleanup result, and explicit certification exclusions in `docs/screenshots/manifest.json`.
