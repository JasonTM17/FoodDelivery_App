# 2. i18n Strategy — nestjs-i18n + flutter_localizations + next-intl

Date: 2026-06-07

## Status

Accepted

## Context

FoodFlow targets Vietnamese, English, and Japanese markets. Three separate client layers exist — NestJS backend (error messages, notifications, AI templates), Flutter mobile apps, and Next.js web apps. Each layer has its own i18n ecosystem; we need consistent locale propagation end-to-end without coupling implementations.

User locale must be persisted (database), inferred (Accept-Language), and threaded through async pipelines (BullMQ notification jobs).

## Decision

Use idiomatic i18n libraries per layer:

| Layer | Library | Locale source |
|---|---|---|
| NestJS backend | `nestjs-i18n` | Accept-Language header → cookie → `User.preferredLocale` |
| Flutter mobile | `flutter_localizations` + ARB files | Device locale → `User.preferredLocale` |
| Next.js web | `next-intl` | URL prefix (`/vi/`, `/en/`, `/ja/`) → cookie |

Shared translation keys are **not** synced across layers — each layer owns its own message catalog. The `@foodflow/i18n` package holds shared web messages only (admin + restaurant apps share translations).

`User.preferredLocale` (enum `LocaleCode { vi, en, ja }`, default `vi`) is the single source of truth persisted to PostgreSQL.

## Consequences

### Positive

- Each layer uses its ecosystem's canonical tool — no custom plumbing.
- Adding a new locale requires only: new ARB file (mobile) + new JSON namespace files (backend) + new messages file (web).
- Locale stored on user → survives device switches.

### Negative

- Translation strings are duplicated across layers; a UI string change in one layer does not auto-update others.
- Three separate translation catalogs to maintain.

### Neutral

- `ja` locale is scaffolded with machine-translated strings; human review required before GA.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Single i18n service over HTTP | Network hop per translated string; latency unacceptable for mobile |
| Locize / Phrase cloud TMS | Cost + vendor lock-in for a project still in beta |
| i18next everywhere (backend + web) | Flutter cannot use i18next; forces custom bridge code |

## References

- [nestjs-i18n docs](https://nestjs-i18n.com)
- [flutter_localizations docs](https://docs.flutter.dev/ui/accessibility-and-internationalization/internationalization)
- [next-intl docs](https://next-intl-docs.vercel.app)
- [ADR-0003](0003-locale-propagation.md) — locale resolution chain detail
