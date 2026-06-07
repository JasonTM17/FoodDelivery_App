# FoodFlow i18n Guide

Supported locales: **vi** (Vietnamese, default), **en** (English), **ja** (Japanese).

---

## Architecture Overview

Three independent i18n layers, each using its ecosystem's canonical library:

| Layer | Library | Locale anchor |
|---|---|---|
| NestJS backend | `nestjs-i18n` | Accept-Language header → cookie `lang` → `User.preferredLocale` |
| Flutter mobile | `flutter_localizations` + ARB files | Device locale → `User.preferredLocale` |
| Next.js web | `next-intl` | URL prefix `/[locale]/` → cookie `NEXT_LOCALE` |

`User.preferredLocale` (`LocaleCode` enum: `vi | en | ja`, default `vi`) is the persisted source of truth in PostgreSQL. Users update it via `PATCH /users/me { preferredLocale: 'en' }`.

---

## Backend (NestJS)

### File Layout

```
backend/src/i18n/
├── i18n.module.ts           NestJS module — registers resolvers
├── fallback-translations.ts fallbackT() for unit-test context
├── i18n-locale.spec.ts      Resolution chain unit tests
└── locales/
    ├── vi/
    │   ├── errors.json
    │   ├── notifications.json
    │   ├── ai_templates.json
    │   └── constants.json
    ├── en/  (same namespaces)
    └── ja/  (same namespaces)
```

### Resolver Priority

Registered in `I18nSetupModule` (see `i18n.module.ts`):
1. `?lang=` query param
2. `Accept-Language` header
3. `lang` cookie

Fallback: `vi`.

### Using Translations in Services

```typescript
import { I18nService } from 'nestjs-i18n'

constructor(private i18n: I18nService) {}

// key format: '{namespace}.{key}'
const msg = await this.i18n.t('errors.promotion_expired', { lang })
// with args
const msg = await this.i18n.t('errors.promotion_min_order', { lang, args: { amount: 50000 } })
```

For code that runs outside a request context (BullMQ processors, unit tests), use `fallbackT`:

```typescript
import { fallbackT } from '../i18n/fallback-translations'

const msg = fallbackT('notifications.order_update_title')
// with args
const msg = fallbackT('notifications.order_update_body', { orderId: '123', event: 'accepted' })
```

### Locale in Async Jobs

Callers **must** serialise locale into job data explicitly:

```typescript
await this.notificationsQueue.add('send', {
  userId,
  templateKey: 'order_update',
  locale: user.preferredLocale,   // ← required
  args: { orderId },
})
```

Processor reads `job.data.locale` — never infers from request context.

### Adding a New Namespace

1. Create `backend/src/i18n/locales/vi/<namespace>.json`
2. Create matching `en/<namespace>.json` and `ja/<namespace>.json`
3. Keys use snake_case. Template variables: `{varName}`.
4. If keys need offline fallback, add entries to `fallback-translations.ts`.
5. Run `npm run test` in `backend/` — `i18n-locale.spec.ts` validates all locale files have matching keys.

---

## Mobile (Flutter)

### File Layout

```
mobile/
└── lib/
    ├── l10n/
    │   ├── app_vi.arb    canonical (add new strings here first)
    │   ├── app_en.arb
    │   └── app_ja.arb
    ├── providers/
    │   └── locale_provider.dart   Riverpod StateNotifier for locale
    └── widgets/
        └── locale_switcher.dart
```

### Using Translations

```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

// inside a widget build()
final l10n = AppLocalizations.of(context)!;
Text(l10n.orderStatusAccepted)
```

### Adding a New Locale String

1. Add the key + Vietnamese value to `app_vi.arb`.
2. Add English value to `app_en.arb`, Japanese to `app_ja.arb`.
3. Run `flutter gen-l10n` (or `flutter pub get`) to regenerate `app_localizations.dart`.
4. Use `AppLocalizations.of(context)!.<key>` in widgets.

### Adding a New Locale (e.g., `ko`)

1. Add `app_ko.arb` with all keys.
2. Register in `MaterialApp`:
   ```dart
   supportedLocales: const [Locale('vi'), Locale('en'), Locale('ja'), Locale('ko')],
   ```
3. Add `ko` to `LocaleCode` enum in backend and web.

---

## Web (Next.js — next-intl)

### File Layout

```
packages/i18n/
└── messages/
    ├── vi.json
    ├── en.json
    └── ja.json

web/apps/admin/
├── app/[locale]/        all routes under locale segment
└── i18n/
    ├── routing.ts       defineRouting({ locales, defaultLocale: 'vi' })
    └── request.ts       getRequestConfig — loads messages

web/apps/restaurant/  (same structure)
```

### Using Translations

```tsx
import { useTranslations } from 'next-intl'

export default function OrdersPage() {
  const t = useTranslations('orders')
  return <h1>{t('title')}</h1>
}

// Server Component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('orders')
```

### Locale Switching

`<LocaleSwitcher>` component uses `next-intl`'s `usePathname` + `useRouter` to redirect to the same path under the new locale prefix.

### Adding a New Message Key

1. Add to `packages/i18n/messages/vi.json` (canonical).
2. Add to `en.json` and `ja.json` with translations.
3. TypeScript will error on missing keys at compile time if `next-intl` type generation is wired.

---

## Adding a New Locale End-to-End

1. **Backend**: create `backend/src/i18n/locales/<lang>/*.json` matching all existing namespaces. Add `<lang>` to `LocaleCode` enum in `backend/src/common/enums/`.
2. **Mobile**: add `app_<lang>.arb`. Register locale in `MaterialApp.supportedLocales`. Run `flutter gen-l10n`.
3. **Web**: add `packages/i18n/messages/<lang>.json`. Add locale to `routing.ts` `locales` array in both admin and restaurant apps.
4. **Test**: run `backend` i18n spec to verify key parity. Run `flutter test` for mobile. Run `pnpm typecheck` for web.

---

## Translation Key Parity Check

The backend test `i18n-locale.spec.ts` asserts that every key present in `vi` locale files also exists in `en` and `ja`. CI fails if parity breaks.
