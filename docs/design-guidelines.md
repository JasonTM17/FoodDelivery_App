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

## Logo System

- Mark: rounded square gradient with delivery route, bowl, leaf, and map pin.
- Meaning: food ordering, freshness, delivery flow, and real-time map visibility.
- Primary assets: `web/apps/admin/public/favicon.svg`, `web/apps/admin/public/foodflow-mark.svg`, `web/apps/restaurant/public/favicon.svg`, and `web/apps/restaurant/public/foodflow-mark.svg`.
- Use the shared React component `FoodFlowLogo` from `@foodflow/ui/foodflow-logo` for sidebar, login, empty-state, and error-state UI.
- Keep the mark on dark sidebar surfaces at 36-40px and on error/empty states at 64-80px.
- Do not replace the vector mark with raster exports unless the target platform requires PNG.

## Typography

- Font: Inter (Latin + Vietnamese diacritics)
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
