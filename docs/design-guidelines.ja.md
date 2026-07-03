# FoodFlow デザインガイドライン

Languages: [English](./design-guidelines.md) | [Tiếng Việt](./design-guidelines.vi.md) | [日本語](./design-guidelines.ja.md)

## ブランドカラー

| Token | Hex | 用途 |
|---|---|---|
| Primary Green | `#2ECC71` | ボタン、リンク、選択状態、成功 |
| Accent Orange | `#F39C12` | 強調、警告、ドライバーマーカー |
| Background | `#FFFFFF` | ページ背景 |
| Card | `#FFFFFF` | カード、浮いたサーフェス |
| Text Primary | `#1A1A1A` | 見出し、本文 |
| Text Muted | `#6B7280` | 補助テキスト、キャプション |
| Sidebar BG | `#14532D` | Admin/Restaurant のダークサイドバー |
| Destructive | `#EF4444` | エラー、削除、キャンセル状態 |

## ロゴシステム

- Mark: 角丸グラデーションの中に配送ルート、ボウル、葉、地図ピンを組み合わせます。
- 意味: 注文、鮮度、配送フロー、リアルタイム地図可視性。
- 主な assets: `web/apps/admin/public/favicon.svg`, `web/apps/admin/public/foodflow-mark.svg`, `web/apps/restaurant/public/favicon.svg`, `web/apps/restaurant/public/foodflow-mark.svg`。
- Sidebar、login、empty state、error state では `@foodflow/ui/foodflow-logo` の `FoodFlowLogo` を使います。
- 推奨サイズ: ダークサイドバーでは 36-40px、error/empty state では 64-80px。
- 対象プラットフォームが PNG を要求しない限り、vector SVG を raster に置き換えません。

## Typography

- Font: Inter。Latin と Vietnamese diacritics をサポートします。
- Heading: 20-28px、bold 700。
- Body: 14-16px、regular 400。
- Caption: 12px、medium 500。
- Price: 16-18px、semibold 600、green。

## Radius と spacing

- Card、button、input: 12px。
- Badge: pill/full radius。
- Spacing: xs 4px, sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px。

## Component patterns

### Order status badges

- created/pending: gray。
- preparing/delivering: amber/yellow。
- completed/delivered: green。
- cancelled/refunded: red。

### Map markers

- Restaurant: green pin。
- Driver online: green dot。
- Driver delivering: orange motorcycle。
- Customer: blue pin。
