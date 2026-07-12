# 3. Locale Propagation Chain

Date: 2026-06-07

## Status

Accepted

## Context

A user's locale must flow from HTTP request through synchronous handlers and into asynchronous BullMQ jobs (notification fanout). Without explicit propagation, async jobs default to the system locale (`vi`), sending English or Japanese users Vietnamese notifications.

## Decision

Locale is resolved and carried explicitly at each hop:

```text
HTTP request
  → NestJS I18nMiddleware reads Accept-Language header
  → Falls back to cookie `NEXT_LOCALE`
  → Falls back to `User.preferredLocale` from JWT payload
  → Sets `req.i18nLang` for the duration of the synchronous request

Notification fanout (BullMQ job)
  → Caller serialises `locale: LocaleCode` into job data
  → Processor reads `job.data.locale` (never uses request context)
  → `I18nService.t(key, { lang: job.data.locale, args })` renders from locale JSON

User profile update
  → PATCH /users/me { preferredLocale: 'en' }
  → Persisted to User.preferredLocale in PostgreSQL
  → JWT refresh picks up updated locale on next login
```

`LocaleCode` enum (`vi | en | ja`) is defined once in `backend/src/i18n/locales/` and re-exported — no string literals elsewhere.

## Consequences

### Positive

- Async jobs always send in the correct user locale.
- Resolution chain handles unauthenticated requests gracefully (Accept-Language → `vi` default).
- Missing i18n injection/configuration fails during tests or module boot instead of returning stale hardcoded strings.

### Negative

- Callers must explicitly pass locale when enqueuing jobs — easy to forget.
- JWT does not auto-update on preferredLocale change; user must re-login.

### Neutral

- Cookie `NEXT_LOCALE` is set by next-intl's middleware; backend reads it as a secondary signal only.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Thread locale via AsyncLocalStorage | Works for synchronous chains; breaks across BullMQ worker process boundary |
| Always read User.preferredLocale from DB in processor | Extra DB query per notification job; unnecessary at scale |
| Derive locale only from Accept-Language | Stateless but ignores explicit user preference |

## References

- `backend/src/i18n/i18n.module.ts` — nestjs-i18n module config
- [ADR-0002](0002-i18n-strategy.md) — library selection rationale
