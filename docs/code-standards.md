# FoodFlow Code Standards

Languages: [English](./code-standards.md) | [Tiếng Việt](./code-standards.vi.md) | [日本語](./code-standards.ja.md)

These standards keep FoodFlow maintainable across backend, web, mobile, infrastructure, and documentation work.

## General rules

- Prefer KISS, YAGNI, then DRY.
- Keep changes scoped to the accepted task.
- Use descriptive names and avoid clever one-off abstractions.
- Consider splitting code files above 200 lines when there is a clear feature or component boundary.
- Do not add runtime mock data, fake analytics, random business values, or fallback success paths.
- Do not commit secrets, dotenv files, private keys, local tool state, screenshots from ad-hoc testing, or AI assistant private files.
- Use conventional commits without AI attribution.
- Keep user-facing copy in localization files, not inline in components.

## Repository hygiene

- Source code, docs, tests, and deploy configuration belong in the repository.
- Local assistant state belongs outside Git and is ignored by `.gitignore`.
- Approved visual assets belong under app `public/` folders or documented `docs/screenshots/` paths.
- Generated Playwright screenshots, login-logo experiments, temporary maps, logs, and cache folders must stay untracked.
- Large caches and backup folders outside the repo must be removed only after their purpose is verified and a backup exists.

## Backend: NestJS and Prisma

Typical module layout:

```text
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  dto/
  entities-or-types/
  feature.gateway.ts
```

Rules:

- Validate external input at the controller boundary with DTOs, pipes, or explicit schemas.
- Keep authorization checks close to protected operations.
- Use Prisma for normal queries and `$queryRaw` only for PostGIS or query shapes Prisma cannot express safely.
- Use transactions for money movement, status transitions, and multi-table invariants.
- Return web errors as RFC 7807 Problem Details.
- Keep customer/mobile compatibility unless the change is explicitly versioned.
- Do not fabricate payment success; missing provider configuration must return a clear degraded or configuration error.
- Treat external provider rejection as an error unless the provider returned a documented per-item outcome. Durable notification jobs must rethrow unknown FCM/provider failures so retry policy can run; never mark a token stale without a permanently-invalid response code.

## Web: Next.js Admin and Restaurant

- Stay on Next.js 15, React 18, ESLint 8, and pinned pnpm 11.11.0 until a separate migration is approved.
- Routes live under `app/[locale]`; non-locale routes are compatibility redirects only.
- Use next-intl for `vi`, `en`, and `ja`.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` for new route segments.
- Every server query needs loading, empty, retryable error, and permission-denied states.
- Destructive actions need confirmation.
- Optimistic updates are allowed only when rollback is safe.
- Shared API access must go through `web/packages/api-client` or an approved wrapper.
- Navigation changes must keep the locale URL, expose a skip target and visible `:focus-visible` state, label icon-only controls, manage dialog focus, and honor `prefers-reduced-motion`. Do not use broad `transition-all` for interaction UI.

## Mobile: Flutter

- Use generated localization from ARB files.
- Keep API changes compatible with the mobile/customer contract during Batch 4.
- Do not generate or commit a new mobile API client until the Batch 4 OpenAPI contract is stable.
- Reconcile mobile work only from verifiable branches, commits, and patch evidence. Do not name, recreate, or infer missing refs.
- For authentication or availability changes, invalidate stale async work before clearing state. Cancel realtime/location subscriptions on logout, and do not show offline/paused until the canonical server command succeeds.

## i18n patterns

Backend:

- Locale files live under `backend/src/i18n/locales/{vi|en|ja}`.
- Async jobs must receive locale explicitly; do not infer it from request context.
- Tests should enforce key parity across `vi`, `en`, and `ja`.

Web:

- Use `useTranslations` in Client Components.
- Use `getTranslations` in Server Components.
- Locale-preserving navigation must be used for sidebar links, breadcrumbs, login redirects, and session-expired redirects.

Mobile:

- Add ARB keys to the canonical locale first, then replicate to `en` and `ja`.
- Run the Flutter localization generator after changing ARB files.

## Testing expectations

Run the narrowest useful test first, then broaden when contracts or shared behavior changed.

Minimum gates before a Batch 4 PR:

- Backend Prisma validation/generation, typecheck, lint, Jest, contract tests, and build.
- Web API client generation/typecheck and OpenAPI validation.
- Admin and Restaurant typecheck, ESLint with no warnings, Vitest, and production builds.
- Playwright on Chromium and Firefox with seeded data.
- Axe with no serious or critical violations.
- Secret scan and artifact scan on the diff.

## Documentation

- Update docs when behavior, setup, architecture, security posture, commands, or public contracts change.
- Keep important docs available in English, Vietnamese, and Japanese.
- Document verified behavior only. If a feature is degraded or pending, say so directly.
