# Restaurant ガイド

言語: [English](./restaurant-guide.md) | [Tiếng Việt](./restaurant-guide.vi.md) | **日本語**

FoodFlow Restaurant は owner と認可済み staff 向けの locale 対応 Next.js workspace です。本書は現在の route/permission model に基づき、production certification ではありません。

## 前提

- API と Restaurant を起動し、`locale` を `vi`、`en`、`ja` のいずれかにして `http://localhost:3002/{locale}/login` を開きます。
- Active restaurant membership の account を使います。Staff は membership permission が許す area だけを利用できます。
- Manifest は非機密の seed identity のみを保存し、password は保存しません。Credential を docs/screenshot/ticket/chat にコピーしません。

## Sign in と order 対応

1. Restaurant email/password を入力し、一度だけ送信します。
2. 成功すると **Orders** が開きます。Membership/permission がない場合、route guard を迂回せず authorization を解決します。
3. Queue から order detail を開き、UI/API が許す transition だけを行います。
4. **Menu** で category、item、option を管理し、保存前に availability/price を再確認します。
5. 運用 session 終了時に sign out します。

![Restaurant orders から menu](./media/gifs/restaurant-orders-to-menu.gif)

## 主な workflow

| Area | 現在の操作 |
|---|---|
| Overview | Restaurant dashboard summary を確認します。 |
| Orders | Queue/detail を確認し、API state を最終判断にします。 |
| Menu | Category と menu item/option の作成・編集を行います。 |
| Promotions | 対象 restaurant の promotion を作成・参照・編集します。 |
| Analytics / Insights | 実 aggregate/insight を確認し、fake fallback data を使いません。 |
| Staff | Staff invite、permission、shift を管理します。Kitchen/manager は owner より狭い権限になり得ます。 |
| Revenue | Restaurant tenant の totals と transaction/history を確認します。 |
| Reviews | Review と関連 summary を確認します。 |
| Notifications | 認証済み Restaurant inbox を確認します。 |
| Settings | 許可範囲で general/profile と opening hours を更新します。 |

Restaurant data は tenant-scoped です。Staff は copied URL で別 restaurant や membership 外 section に入ってはいけません。Restaurant web tracking map は MapLibre 経由の keyless OpenFreeMap のみを受け入れ、Google Maps browser API key は不要です。Backend directions は別の fail-closed integration です。

## Visual reference

| Dashboard | Order queue |
|---|---|
| ![Restaurant dashboard](./screenshots/restaurant/02-dashboard.png) | ![Restaurant orders](./screenshots/restaurant/03-orders.png) |

| Menu | Revenue |
|---|---|
| ![Restaurant menu](./screenshots/restaurant/04-menu.png) | ![Restaurant revenue](./screenshots/restaurant/06-revenue.png) |

| Staff | Settings |
|---|---|
| ![Restaurant staff](./screenshots/restaurant/08-staff.png) | ![Restaurant settings](./screenshots/restaurant/10-settings.png) |

全 10 枚は [product gallery](./product-gallery.ja.md#restaurant) にあります。

## Troubleshooting

| 症状 | 対応 |
|---|---|
| Sign-in に戻る | API health と active restaurant membership を確認し、再 sign-in します。 |
| Section が forbidden | Owner に staff permission の確認を依頼し、direct URL で guard を迂回しません。 |
| Error 後に queue/menu が空 | Retry して visible failure を確認し、failed request を real zero data と扱いません。 |
| Order update rejected | Order を reload して最新 server state に従い、stale transition を繰り返しません。 |
| Map/route unavailable | OpenFreeMap style と backend route/telemetry を確認し、route/ETA を捏造しません。 |

## Evidence boundary

Restaurant PNG/GIF は deterministic seed data の isolated local Docker E2E stack を Google Chrome で capture しました。Manifest は dirty working tree と local images を記録します。Privacy-reviewed product/regression evidence であり、production tenant、release artifact、live provider の証明ではありません。[capture provenance](./screenshots/README.md) と [full gallery](./product-gallery.ja.md) を参照してください。
