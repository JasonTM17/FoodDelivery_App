# FoodFlow Code Standards

## General

- Kebab-case filenames with descriptive names
- Files under 200 lines (split when exceeding)
- No AI references in code or commits
- Vietnamese UI text, English code identifiers

## Backend (NestJS)

```
module/
├── module.module.ts    # NestJS module definition
├── module.controller.ts # HTTP endpoints
├── module.service.ts   # Business logic
├── module.dto.ts       # Zod/class-validator DTOs
└── module.gateway.ts   # WebSocket (if needed)
```

- Use Prisma for 95% of queries, `$queryRaw` for PostGIS
- All endpoints validate input before processing
- RBAC guards on all protected routes
- Error responses in `{ success: false, error: { code, message } }` format

## Frontend (Next.js)

- App Router with per-segment `loading.tsx`, `error.tsx`
- shadcn/ui components for consistency
- TanStack Query for server state
- `use client` only where interactivity needed

## Mobile (Flutter)

- Riverpod for state management
- Every screen handles loading, empty, error states
- Shared widgets in `lib/shared/widgets/`
- API calls through `ApiClient` singleton
- WebSocket through `SocketClient` singleton

## i18n Patterns

### Backend (nestjs-i18n)

- Never hardcode user-facing strings in service/controller files — use `i18n.t('namespace.key', { lang })`
- For async processors (BullMQ), use `fallbackT(key, args)` when `I18nService` is not injectable
- Always pass locale explicitly into job data; do **not** infer from request context in processors
- Locale files live in `backend/src/i18n/locales/{vi|en|ja}/{namespace}.json`
- Key parity across all three locales is enforced by `i18n-locale.spec.ts`

```typescript
// Correct — explicit lang from request or job data
const msg = await this.i18n.t('errors.order_cannot_cancel', { lang: req.i18nLang })

// Correct — async context without I18nService
const msg = fallbackT('notifications.order_update_title')
```

### Mobile (Flutter)

- Use `AppLocalizations.of(context)!.<key>` — never hardcode Vietnamese strings in widgets
- ARB canonical file is `app_vi.arb`; add new keys there first, then replicate to `en` and `ja`
- Run `flutter gen-l10n` after adding keys to regenerate the generated `app_localizations.dart`

```dart
// Correct
Text(AppLocalizations.of(context)!.orderAccepted)

// Wrong — hardcoded
Text('Đơn hàng đã được chấp nhận')
```

### Web (next-intl)

- All routes live under `app/[locale]/` — never under `app/` directly
- Use `useTranslations('namespace')` in Client Components, `getTranslations` in Server Components
- Shared messages between admin and restaurant apps go in `packages/i18n/messages/`
- Locale switcher uses next-intl router — do not manipulate `window.location` manually

```tsx
// Server Component
const t = await getTranslations('orders')
return <h1>{t('title')}</h1>

// Client Component
const t = useTranslations('orders')
```

### Adding a New Locale

See `docs/i18n-guide.md` — Adding a New Locale End-to-End section.

## Git

- Conventional Commits: `type(scope): subject`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Subject ≤72 chars, imperative mood
- One logical change per commit
- No `Co-Authored-By` or AI references
