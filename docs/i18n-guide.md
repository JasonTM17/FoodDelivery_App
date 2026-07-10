# FoodFlow i18n Guide

FoodFlow supports Vietnamese (vi, default), English (en), and Japanese (ja).
Every user-visible, screen-reader, validation, notification, and export-facing
string must have all three translations.

## Locale authority

| Surface | Library | Authoritative locale |
| --- | --- | --- |
| NestJS API | nestjs-i18n | Explicit ?lang, then Accept-Language, then lang cookie; fallback vi |
| Admin / Restaurant | next-intl | Explicit /[locale]/ URL segment |
| Flutter | Flutter localization + ARB | In-app selected locale, initially derived from device/profile preference |

User.preferredLocale is a durable profile preference, not permission to
silently rewrite an explicit web URL or API locale request. It should be
included explicitly in background-job payloads that create a user-facing
notification.

For Admin and Restaurant, the pathname always wins. The locale switcher may
write NEXT_LOCALE to remember a future navigation preference, but a stale cookie
must never cause /en/... to render Vietnamese or change the html lang value.

## Backend

Backend locale files live under backend/src/i18n/locales/{vi,en,ja}/. The
resolver order in I18nSetupModule is:

1. ?lang=
2. Accept-Language
3. lang cookie
4. Vietnamese fallback

Use I18nService, never a production hard-coded fallback map:

~~~ts
const message = await this.i18n.t('errors.promotion_expired', { lang })
~~~

Background jobs must receive their locale with the job data:

~~~ts
await this.notificationsQueue.add('send', {
  userId,
  locale: user.preferredLocale,
  templateKey: 'order_update',
  args: { orderId },
})
~~~

When adding a namespace:

1. Add matching JSON files under vi, en, and ja.
2. Use stable snake_case keys and named placeholders.
3. Add or update focused tests that exercise the service's required keys.
4. Run the backend test suite before merging.

## Web

Web translation sources are split intentionally:

~~~text
web/packages/i18n/messages/{vi,en,ja}.json     shared product vocabulary
web/apps/admin/messages/{vi,en,ja}.json        Admin-specific copy
web/apps/restaurant/messages/{vi,en,ja}.json   Restaurant-specific copy
web/apps/*/src/i18n.ts                          request config and merge
web/apps/*/src/app/[locale]/layout.tsx          locale-bound shell
~~~

The [locale] layout is responsible for the locale-bound client provider and
shell. A root layout must not choose its presentation locale from a cookie when
an explicit route locale exists.

~~~tsx
import { useTranslations } from 'next-intl'

export function OrdersHeading() {
  const t = useTranslations('orders')
  return <h1>{t('title')}</h1>
}
~~~

Add a web string to every appropriate source, then validate all three routes in
a new browser context:

~~~text
/vi/login
/en/login
/ja/login
~~~

Check document lang, page title, heading, form labels, visible text, keyboard
focus, and console errors. Do not pass a locale test solely because a cookie
changed.

## Flutter

Flutter ARB files live in mobile/lib/l10n/:

~~~text
app_vi.arb
app_en.arb
app_ja.arb
~~~

Add the key to all locale files, regenerate localization output using the
project's Flutter configuration, and use the generated
AppLocalizations.of(context) API. A new locale also requires matching backend
and web support before it is advertised.

## Translation quality checks

- Avoid concatenating translated fragments; use placeholders so grammar can
  change by locale.
- Use locale-aware currency/date formatting for business values.
- Translate accessible names, error messages, password visibility labels,
  empty states, and export headings as well as visible headings.
- Keep API error codes stable; translate their human message separately.
- Test vi, en, and ja after any shared key, route, or shell change.

For release coverage, see [Testing guide](testing-guide.md) and
[Product gallery](product-gallery.md).
