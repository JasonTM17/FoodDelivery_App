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

Batch 4 E2E は login/RBAC、locale routes、WebSocket order feed、promotion CRUD、support flow、exports、menu、revenue、staff、insights、notifications、tenant isolation を含めます。

Realtime security regression では次も確認します。

- Token なし、refresh token、期限切れ token、不正署名では Socket.IO に接続できない。
- Admin 以外は Admin order/driver room に join できない。
- Restaurant は別 tenant の room に join できない。
- Customer、driver、restaurant staff は無関係な order room に join できない。
- 認証済み driver account のみ GPS update を送信できる。
- Admin/Restaurant web client は reconnect 時に最新 access token を送信する。

## Accessibility and visual QA

- Axe serious/critical issue は 0。
- Keyboard navigation、visible focus、dialog focus trap、chart/table alternatives を確認。
- Approved Stitch baseline と比較。
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

## Security checks

```bash
git diff --check
git diff --cached --check
```

Staged と tracked-file の secret scan を実行します。`.env.example` の placeholder は許可しますが、real token、private key、database credential、service-role secret は block します。
