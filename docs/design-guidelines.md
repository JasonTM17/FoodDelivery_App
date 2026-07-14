# FoodFlow Design Guidelines

Languages: [English](./design-guidelines.md) | [Tiếng Việt](./design-guidelines.vi.md) | [日本語](./design-guidelines.ja.md)

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary Green | `#2ECC71` | Buttons, links, active states, success |
| Accent Orange | `#F39C12` | Highlights, warnings, driver markers |
| Background | `#FFFFFF` | Page background |
| Card | `#FFFFFF` | Cards, elevated surfaces |
| Text Primary | `#1A1A1A` | Headings, body text |
| Text Muted | `#6B7280` | Secondary text, captions |
| Sidebar BG | `#14532D` | Admin dark sidebar |
| Destructive | `#EF4444` | Errors, delete actions, cancelled status |

## Dark operational surfaces

Driver operational screens may use dark surfaces, but text must use semantic dark `onSurface` and `onSurfaceVariant` tokens rather than light-theme gray literals. Offline is muted neutral, paused is amber, online is green, and status color must always be accompanied by a localized text label.

## Product-surface rules

The design system serves four products, not only the two web dashboards. Keep each surface focused on its operator and decision cadence:

| Surface | Primary job | UX requirements |
|---|---|---|
| Admin | Operate the marketplace and resolve exceptions | Dense but scannable tables, filters, audit context, responsive navigation, and non-color status labels. |
| Restaurant | Fulfil orders and manage the menu | Order-state priority, clear preparation timers, safe bulk actions, and fast mobile drawer access. |
| Customer | Discover, order, pay, and track | Large touch targets, readable price/fee breakdowns, explicit loading/error/retry states, and no surprise permission prompt before the feature that needs it. |
| Driver | Go online, accept work, navigate, and prove delivery | A single clear operational state, GPS/notification permission rationale before the system prompt, map controls reachable one-handed, and an always-visible safe offline/paused path. |

Never use an Admin/Restaurant screenshot as a substitute for native Customer or Driver validation. Capture each native flow on a device or emulator when visual parity or release evidence is required.

## Logo System

- Mark: rounded square gradient with delivery route, bowl, leaf, and map pin.
- Meaning: food ordering, freshness, delivery flow, and real-time map visibility.
- Primary assets: `web/apps/admin/public/favicon.svg`, `web/apps/admin/public/foodflow-mark.svg`, `web/apps/restaurant/public/favicon.svg`, and `web/apps/restaurant/public/foodflow-mark.svg`.
- Use the shared React component `FoodFlowLogo` from `@foodflow/ui/foodflow-logo` for sidebar, login, empty-state, and error-state UI.
- Keep the mark on dark sidebar surfaces at 36-40px and on error/empty states at 64-80px.
- Do not replace the vector mark with raster exports unless the target platform requires PNG.

## Typography

- Font: Inter (Latin + Vietnamese diacritics); provide a system Japanese fallback such as `Noto Sans JP` when rendering Japanese content.
- Headings: 20-28px, bold (700)
- Body: 14-16px, regular (400)
- Captions: 12px, medium (500)
- Prices: 16-18px, semibold (600), green

## Border Radius

- Cards: 12px (ROUND_TWELVE)
- Buttons: 12px
- Inputs: 12px
- Badges: full (pill)

## Spacing Scale

- xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px

## Component Patterns

### Order Status Badges

- created/pending: gray
- preparing/delivering: amber/yellow
- completed/delivered: green
- cancelled/refunded: red

### Map Markers

- Restaurant: green pin
- Driver (online): green dot
- Driver (delivering): orange motorcycle
- Customer: blue pin

## Responsive dashboard navigation

- Desktop Restaurant navigation uses one collapsible sidebar; mobile uses one controlled drawer with the same destinations.
- Provide a visible-on-focus skip link to main content, an accessible dialog title/description, an explicit close label, and initial focus in the opened drawer.
- Icon-only controls require an accessible name. Active navigation uses both visual state and `aria-current="page"`.
- Use 44px minimum touch targets for mobile controls. Animate only the affected property, provide `motion-reduce` behavior, and never rely on motion to communicate state.
