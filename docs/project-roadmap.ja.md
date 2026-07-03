# FoodFlow Project Roadmap

言語: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

この roadmap は integration branch の方針を示します。すでに landed したものと、production deployment 前にまだ test が必要なものを分けています。

## 現在の優先事項: Batch 4 web/backend parity

Goal: Admin と Restaurant dashboard を real backend data で production-grade にしつつ、Next.js 14、React 18、ESLint 8、pnpm 10、既存 mobile/customer contracts を維持します。

Batch 4 は local gates、E2E、accessibility、visual checks、tenant-isolation checks、deployment validation が通るまで完了ではありません。

## Integration branch に landed

- `batch4-integration` の clean integration worktree。
- Web response contract `{ success: true, data, meta? }` を document 済み。
- Error contract RFC 7807 Problem Details を document 済み。
- OpenAPI validation workflow と Spectral rules を追加済み。
- Shared web API client は `web/packages/api-client` 配下に維持。
- Restaurant revenue と analytics formatting を localize 済み。
- SePay runtime は必須設定がないと successful intent を捏造しません。
- Vietnamese AI chat fast paths に focused tests を追加済み。
- Core setup、testing、deployment docs を English/Vietnamese/Japanese で開始済み。

## Draft PR 前に進行中

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
- Violet と Indigo mobile reconciliation は Batch 4 web/backend 安定後の別 mobile branch に defer。
- Generated screenshots、local caches、backup folders、assistant private files は Git に入れません。

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

1. `batch4-integration` を push。
2. `master` 向け draft PR を開く。
3. Branch disposition、test matrix、rejected changes、known degraded states を添付。
4. Required checks 通過後、merge commit で merge。
5. Rotated secrets が有効な場合のみ Supabase に database/realtime resources を deploy。
6. Local と PR gates が green の場合のみ Vercel に web surfaces を deploy。
7. Production smoke tests、realtime checks、map checks、AI chatbot checks、keep-alive monitoring を実行。

## Batch 4 から deferred

- Mobile Violet/Indigo reconciliation。
- Next.js、React、ESLint、Node major migrations。
- httpOnly cookie auth migration。
- Data warehouse または OLAP redesign。
- Nodemailer major migration。
- Next.js 14、React 18、ESLint 8 と conflict する dependency major upgrades。
- 全 gates が green になる前の deployment。
