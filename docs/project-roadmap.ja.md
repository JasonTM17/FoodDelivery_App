# FoodFlow Project Roadmap

言語: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

この roadmap は `master` に merge 済みの Batch 4 方針を示します。すでに landed したものと、production deployment 前にまだ test が必要なものを分けています。

## 現在の優先事項: merge 後 hardening と deployment readiness

Goal: Admin、Restaurant、backend、mobile を merge 済み Batch 4 contract に合わせ続け、deployment readiness gaps を閉じ、GitHub Actions auth 復旧後に remote CI を rerun します。Next.js 14、React 18、ESLint 8、固定済み pnpm 11.7.0、現行 Flutter constraints は維持します。

Batch 4 は local gates、E2E、accessibility、visual checks、tenant-isolation checks、remote CI/security checks、deployment validation が通るまで完了ではありません。

## `master` に landed

- `codex/batch4-integration` は `3857433` で `master` に fast-forward 済みです。patch-equivalence 確認後、remote integration branch は削除されました。Verified runtime code includes `161ce9a`, and Docker/E2E was rerun after docs head `e24631c`; docs-only evidence commits 後の正確な current `master` SHA は `git ls-remote --heads origin` で確認します。
- Web response contract `{ success: true, data, meta? }` を document 済み。
- Error contract RFC 7807 Problem Details を document 済み。
- OpenAPI validation workflow と Spectral rules を追加済み。
- Shared web API client は `web/packages/api-client` 配下に維持。
- Restaurant revenue と analytics formatting を localize 済み。
- SePay runtime は必須設定がないと successful intent を捏造しません。
- Vietnamese AI chat fast paths に focused tests を追加済み。
- Core setup、testing、deployment docs を English/Vietnamese/Japanese で開始済み。
- Mobile Flutter gate は 2026-07-05 に local 再確認済みです。`flutter analyze` は clean、`flutter test` は 166 tests passed、`dart analyze mobile/packages/api_client` は clean、customer/driver Android debug APK builds も pass。GitHub Actions は account token/auth または billing status により blocked されているため、修正後に remote checks を rerun する必要があります。
- Mobile runtime UI は touched dispatch/cancel flows の targeted scanner 上で hardcoded presentation string が残っておらず、runtime の "coming soon" action もありません。Backend timestamp は current-time fallback ではなく deterministic sentinel で扱い、release build は明示的な `API_BASE_URL` を必須にします。
- Customer/driver tracking maps は backend-routed `routePolyline` を使い、realtime 前に REST snapshot `/orders/:id/tracking` を hydrate し、telemetry trail と planned route を分離し、pickup/dropoff route phase を扱い、phase 変更または route-less snapshot で stale route geometry を clear し、driver GPS metadata を backend の km/h contract に normalize します。Route provider が使えない場合も straight-line ETA minutes を捏造しません。初期 `driver:assigned` event は tracking が Google/OSRM route を得るまで `etaMinutes` を null のままにします。
- Dispatch は restaurant coordinates と attempt metadata を含む route-aware driver jobs を enqueue し、legacy malformed queue jobs を安全に扱い、ioredis `GEOSEARCH WITHDIST` tuple rows を crash せず parse します。
- Admin shared tag input は default English placeholder copy を生成しません。Caller が localized placeholder を渡す必要があります。
- Batch 4 merged worktree の最新 local evidence: backend typecheck/lint/build と Jest (107 suites / 760 tests)、web typecheck/lint/build と Vitest (Admin 35 files / 144 tests; Restaurant 28 files / 83 tests)、Playwright Chromium + Firefox 70/70、Docker health checks、tenant isolation、visual contract、axe serious/critical smoke、mobile Flutter tests (166)、customer/driver Android debug APK builds が pass。
- Remote CI は `e776f5c` が last fully green です: Gitleaks、Lint、Build Check、SBOM、Trivy、CodeQL、CI、E2E Tests、Integration Smoke Gate。Current head CI は GitHub token/auth または billing status により job start 前に blocked されています。

### Mobile

- Flutter customer/driver app を安定済み Batch 4 API contract に合わせる。
- OpenAPI contract を意図的に refresh するまで mobile API client は regenerate/commit しない。
- Violet/Indigo は branch refs または review 済み patch artifacts が入手できた場合だけ reconcile する。現在の `origin` head list にはそれらの branch は無い。
- Mobile に影響する backend/web contract 変更後は `flutter analyze` と `flutter test` を再実行する。

## Deployment 前に進行中

### Backend

- payment、promotion、support、analytics、reporting path に残る runtime mock/fallback を削除。
- 既存 `AdminExportJob` model 上で canonical Admin export jobs を完成。
- `PlatformSetting` backed な Platform Settings endpoints を完成。
- order item value に基づく order/revenue/category attribution を verify。
- Benchmark privacy を verify: cohort は最低 10 restaurants、足りない場合は identity を出さず platform aggregate を使う。
- Support SLA を ICT business hours で verify し、customer 待ちでは pause。

### Admin dashboard

- Real data の dashboard KPI、comparison、timeseries、heatmap、recent orders を完成。
- Orders list/detail/status updates と WebSocket `/events` status、controlled polling fallback を完成。
- Restaurant approval detail、menu/orders/reviews/finance/KPI を完成。
- Users、wallet、voucher、refund、KYC views を完成。
- Promotions CRUD、toggle、analytics、overlap validation を完成。
- Support queue/detail/messages/reply/internal note/bulk action/macros/CSAT を完成。
- Audit logs と exports の progress/download を完成。
- Settings と AI monitor は real-data backed または明確な degraded state にします。

### Restaurant dashboard

- Profile、onboarding、operating hours を完成。
- Real data から overview KPI を完成。
- Menu categories/items/options visibility と reorder を完成。
- Kanban orders、detail、status transitions、order chat を完成。
- Reviews と merchant reply を完成。
- Revenue drill-down と export formats を完成。
- Promotions CRUD、targeting preview、scheduling、analytics、broadcast を完成。
- Staff invitations、permissions、shift schedule を完成。
- Insights、menu analytics、privacy-safe benchmark を完成。
- `/notifications` の shared notifications を使います。

### UI, UX, design

- 既存 7 つの Stitch desktop screens を visual baseline として維持。
- 本当の screen gap がある場合だけ focused Stitch designs を追加。
- Dark sidebar、orange/green accents、dense cards、一貫した filters/action bars を適用。
- Loading、empty、retryable error、permission-denied、disabled、success、destructive-confirmation states を追加。
- 1440、1280、tablet、mobile widths で responsive layout を検証。
- 承認済み logos/assets は app `public/` または docs asset folders に置き、repo root には置きません。

### Maps and AI chatbot

- Maps は provider state を正しく反映します。Google Maps は設定がある場合、OSRM/backend fallback は product behavior と一致する場合、どちらもない場合は明確な degraded state。
- AI chatbot は LLM provider adapter を使い、現在の default は DeepSeek です。設定不足では明確な degraded response を返します。
- 露出した API key は production 前に rotate し、real value は ignored env または provider secret store のみに保存します。

### Repository hygiene and branch salvage

- Stale team branches を raw merge しません。
- Amber、Steel、audit branches からは focused tests で証明した behavior だけ port します。
- Violet または Indigo ref が再出現した場合は、focused Flutter tests 付きで hunk-by-hunk に salvage し、disposition をここに記録する。
- Generated screenshots、local caches、backup folders、assistant private files は Git に入れません。
- 意図的に新しい review branch を開く場合を除き、`master` を唯一の live remote branch として維持します。

## Deployment 前の required gates

- Clean environment で `pnpm install --frozen-lockfile`。
- Backend Prisma validate/generate/migration checks、typecheck、lint、Jest、contract tests、build。
- Web API client generation/typecheck と OpenAPI validation。
- Admin/Restaurant typecheck、warning なし ESLint、Vitest、production builds。
- Chromium/Firefox Playwright: login、RBAC、locale、promotions、support、exports、WebSocket orders、menu、revenue、staff、insights、maps、AI chatbot。
- Axe に serious/critical がないこと。
- Approved Stitch screens との visual regression。
- Restaurant-scoped reads/writes の tenant-isolation tests。
- Secret scan、artifact scan、`.gitignore` hygiene check。

## Gates が green になった後の deploy plan

1. `master` を clean かつ pushed に保つ。
2. GitHub Actions token/auth/billing access を復旧し、blocked CI/security workflows を rerun する。
3. Branch disposition、test matrix、rejected changes、known degraded states を release report に添付。
4. Rotated secrets が有効な場合のみ Supabase に database/realtime resources を deploy。
5. Local と remote gates が green の場合のみ Vercel に web surfaces を deploy。
6. Production smoke tests、realtime checks、map checks、AI chatbot checks、export checks、mobile API checks、keep-alive monitoring を実行。

## Batch 4 から deferred

- Next.js、React、ESLint、Node major migrations。
- httpOnly cookie auth migration。
- Data warehouse または OLAP redesign。
- Nodemailer major migration。
- Next.js 14、React 18、ESLint 8 と conflict する dependency major upgrades。
- 全 gates が green になる前の deployment。
