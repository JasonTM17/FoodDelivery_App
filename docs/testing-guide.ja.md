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

## Playwright E2E

```bash
cd web
pnpm test:e2e:install
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

Batch 4 E2E は login/RBAC、locale routes、WebSocket order feed、promotion CRUD、support flow、exports、menu、revenue、staff、insights、notifications、tenant isolation を含めます。`web/e2e/tests/tenant-isolation.spec.ts` は、restaurant user が別 restaurant tenant の order を list/read/update できないことを検証します。

Realtime security regression では次も確認します。

- Token なし、refresh token、期限切れ token、不正署名では Socket.IO に接続できない。
- Admin 以外は Admin order/driver room に join できない。
- Restaurant は別 tenant の room に join できない。
- Customer、driver、restaurant staff は無関係な order room に join できない。
- 認証済み driver account のみ GPS update を送信できる。
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
flutter analyze
flutter test
```

Mobile API client は安定済みの Batch 4 OpenAPI contract を使います。
Batch 4 mobile gate は `flutter analyze` が issue 0 で、Flutter test suite 全体が pass することを必須にします。
最新の local evidence: 2026-07-04 `codex/batch4-integration` の `1b96e3c` で、`flutter analyze` は issue 0、`flutter test` は 128 tests passed。同じ head は GitHub Mobile CI と Integration Smoke Gate 全体でも green です。

## Security checks

```bash
git diff --check
git diff --cached --check
```

Staged と tracked-file の secret scan を実行します。`.env.example` の placeholder は許可しますが、real token、private key、database credential、service-role secret は block します。
