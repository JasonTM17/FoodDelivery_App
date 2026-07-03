# Hướng dẫn kiểm thử FoodFlow

Ngôn ngữ: [English](testing-guide.md) | [Tiếng Việt](testing-guide.vi.md) | [日本語](testing-guide.ja.md)

## Backend

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Ví dụ focused:

```bash
pnpm test -- sepay.provider.spec.ts payments.service.spec.ts
pnpm test -- ai-chat.service.spec.ts deepseek-chat-provider.service.spec.ts ai-chat.controller.spec.ts
pnpm test -- restaurant-revenue.service.spec.ts
```

Backend tests phải chứng minh behavior thật: không mock payment runtime, không AI answer giả, không business value random, và query phải tenant-scoped.

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

Batch 4 E2E cần bao phủ login/RBAC, locale routes, WebSocket order feed, promotion CRUD, support flow, exports, menu, revenue, staff, insights, notifications và tenant isolation.

## Accessibility và visual QA

- Axe không có serious/critical issue.
- Keyboard navigation, visible focus, dialog focus trap, chart/table alternatives.
- So sánh với Stitch baseline đã duyệt.
- Kiểm desktop 1440/1280, tablet và mobile.

## Mobile

Mobile reconcile sau khi web/backend Batch 4 ổn định.

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

Mobile API client phải dùng Batch 4 OpenAPI contract đã ổn định.

## Security checks

```bash
git diff --check
git diff --cached --check
```

Chạy staged và tracked-file secret scan. Placeholder trong `.env.example` được phép, nhưng token thật, private key, database credential và service-role secret phải bị block.
