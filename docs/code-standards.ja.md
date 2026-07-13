# FoodFlow Code Standards

言語: [English](./code-standards.md) | [Tiếng Việt](./code-standards.vi.md) | [日本語](./code-standards.ja.md)

この標準は backend、web、mobile、infrastructure、documentation を保守しやすく保つためのものです。

## General rules

- KISS、YAGNI、DRY の順に優先します。
- 変更は合意済み scope に絞ります。
- 説明的な名前を使い、domain anchor のない clever abstraction は避けます。
- Code file が 200 行を超える場合、明確な feature/component 境界があるときだけ分割を検討します。
- Runtime mock data、fake analytics、random business value、fallback success path を追加しません。
- Secrets、dotenv、private keys、local tool state、一時 screenshot、AI assistant private files を commit しません。
- Conventional commits を使い、AI attribution は書きません。
- User-facing copy は localization file に置き、component に inline しません。

## Repository hygiene

- Source code、docs、tests、deploy configuration は repository に置きます。
- Local assistant state は Git の外に置き、`.gitignore` します。
- 承認済み visual assets は app `public/` または `docs/screenshots/` に置きます。
- Generated Playwright screenshots、login logo experiments、一時 maps、logs、cache folders は untracked にします。
- Repository 外の大きな cache/backup folder は、目的と backup を確認してから削除します。

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

- External input は controller boundary で DTO、pipe、または explicit schema により validate します。
- Authorization checks は protected operation の近くに置きます。
- 通常 query は Prisma を使い、PostGIS や Prisma で安全に表現できない query のみ `$queryRaw` を使います。
- Money movement、status transition、multi-table invariant には transaction を使います。
- Web errors は RFC 7807 Problem Details を返します。
- 明示的に version 化しない限り customer/mobile compatibility を維持します。
- Payment success を捏造しません。Provider configuration が不足している場合は明確な degraded/config error を返します。

## Web: Next.js Admin and Restaurant

- 別 migration が承認されるまで Next.js 15、React 18、ESLint 8、固定済みの pnpm 11.11.0 を維持します。
- Routes は `app/[locale]` 配下に置き、non-locale route は compatibility redirect のみにします。
- `vi`, `en`, `ja` には next-intl を使います。
- 新しい route segment には `loading.tsx`, `error.tsx`, `not-found.tsx` を用意します。
- すべての server query に loading、empty、retryable error、permission-denied state を用意します。
- Destructive action には confirmation が必要です。
- Optimistic update は rollback が安全な場合だけ使います。
- Shared API access は `web/packages/api-client` または承認済み wrapper を通します。

## Mobile: Flutter

- ARB から生成された localization を使います。
- Batch 4 では mobile/customer contract との API compatibility を保ちます。
- Batch 4 OpenAPI contract が安定するまで新しい mobile API client を生成・commit しません。
- Mobile work は検証可能な branch、commit、patch evidence だけから reconcile します。Missing ref を命名、再作成、推測しません。

## i18n patterns

Backend:

- Locale files は `backend/src/i18n/locales/{vi|en|ja}` に置きます。
- Async jobs は locale を明示的に受け取り、request context から推測しません。
- Tests は `vi`, `en`, `ja` の key parity を確認します。

Web:

- Client Components では `useTranslations` を使います。
- Server Components では `getTranslations` を使います。
- Sidebar、breadcrumb、login redirect、session-expired redirect は locale を維持します。

Mobile:

- ARB key は canonical locale に先に追加し、その後 `en` と `ja` に展開します。
- ARB 変更後は Flutter localization generator を実行します。

## Testing expectations

まず最小限の focused test を実行し、contract や shared behavior を変えた場合に広げます。

Batch 4 PR 前の最低 gate:

- Backend Prisma validate/generate、typecheck、lint、Jest、contract tests、build。
- Web API client generation/typecheck と OpenAPI validation。
- Admin/Restaurant typecheck、warning なしの ESLint、Vitest、production build。
- Seeded data で Chromium/Firefox Playwright。
- Axe に serious/critical violation がないこと。
- Diff に対する secret scan と artifact scan。

## Documentation

- Behavior、setup、architecture、security posture、commands、public contracts が変わる場合は docs を更新します。
- 重要 docs は English、Vietnamese、Japanese で提供します。
- 検証済みの behavior だけを記載します。Degraded または pending の feature は明示します。

## Reliability と accessibility

- Durable notification は per-token outcome がない FCM/provider failure を queue retry のため rethrow し、permanent-invalid token だけを stale にします。
- Auth/availability では stale async work を invalidate し、logout で realtime/location subscription を cancel します。canonical server command 成功前に offline/paused を表示しません。
- Dashboard navigation は locale URL、skip link、visible focus、icon-only label、dialog focus management、`prefers-reduced-motion` を守り、広い `transition-all` を使いません。
