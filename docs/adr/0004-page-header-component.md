# 4. Shared PageHeader Component for Web Admin and Restaurant Apps

Date: 2026-06-07

## Status

Accepted

## Context

Admin and restaurant Next.js apps had duplicated breadcrumb + gradient-title markup on every page (`app/**/page.tsx`). The pattern is identical: a breadcrumb trail, an H1 with `gradient-text` class, and an optional subtitle. Duplication made sweep-style changes (adding an icon, changing gradient) require touching 15+ files.

## Decision

Extract a shared `<PageHeader>` React Server Component into the shared UI package (`packages/ui` or co-located per app). It accepts `breadcrumbs`, `title`, and optional `subtitle` props and renders the canonical breadcrumb + gradient H1 block.

All `app/**/page.tsx` files in both admin and restaurant apps use `<PageHeader>` instead of inline markup.

```tsx
<PageHeader
  breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Orders' }]}
  title="Orders"
/>
```

## Consequences

### Positive

- Single change point for breadcrumb + header styling.
- Pages are shorter and easier to scan.
- Enforces UI vocabulary rule consistently (no raw `text-yellow-500` in headers).

### Negative

- Component must be imported; new contributors need to know it exists.

### Neutral

- Retrofit applied to all existing admin pages in the vocabulary sweep (commit `79db17b`..`98a522e`).

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| CSS utility class only | Does not enforce props structure; duplication remains |
| Per-app duplicate component | Reverts to the problem — two components drift apart |

## References

- `web/apps/admin/components/page-header.tsx` — component source
- Commits `79db17b`–`98a522e` — sweep applying PageHeader across admin
