# Admin ガイド

言語: [English](./admin-guide.md) | [Tiếng Việt](./admin-guide.vi.md) | **日本語**

FoodFlow Admin は locale 対応の Next.js 運用 dashboard です。本書は現在の route と local visual evidence に基づき、deployed production journey を認証するものではありません。

## 前提

- API と Admin を起動し、`locale` を `vi`、`en`、`ja` のいずれかにして `http://localhost:3000/{locale}/login` を開きます。
- Admin 権限の account を使います。Manifest は非機密の seed identity だけを記録し、password は docs/media から意図的に除外しています。
- Isolated E2E stack では [gallery](./product-gallery.ja.md#recapture) に従い `localhost` origin を使います。

## Sign in と navigation

1. Admin email/password を入力し、一度だけ送信します。
2. 成功すると **Overview** が開きます。認証・認可 error は安全な error state に留まり、loading/blank screen を成功とみなしません。
3. Sidebar を使います。Link は選択中の `vi`、`en`、`ja` locale を保持します。
4. Review 後は sidebar 下部から sign out します。

![Admin sign-in から overview](./media/gifs/admin-login-flow.gif)

## 主な workflow

| Area | 現在の操作 |
|---|---|
| Overview | KPI/chart を確認し、必要な詳細 list へ進みます。 |
| Orders | Filter、order detail、server-backed state を確認します。 |
| Restaurants | Restaurant record/detail と approval action を扱います。 |
| Users / Drivers | Account/driver record を確認し、許可済みの有効な location data だけを map で使います。 |
| Promotions | Promotion の参照・作成・編集を行い、server validation を最終判断にします。 |
| Support | Queue/ticket detail を扱い、load failure を empty queue と誤認しません。 |
| Analytics / Reports | Aggregate/report を確認し、Export Jobs で非同期 export を追跡します。 |
| AI Monitor | AI usage telemetry と明示的な provider degraded state を確認します。 |
| Settings | Admin 権限内で general、branding、compliance、integration を管理します。 |

Admin web map は MapLibre 経由の keyless OpenFreeMap style だけを受け入れ、Google Maps browser API key は不要です。Backend directions は別機能で、Google Directions と owned OSRM の両方が未設定なら fail closed します。

## Visual reference

| Overview | Orders |
|---|---|
| ![Admin overview](./screenshots/admin/02-overview.png) | ![Admin orders](./screenshots/admin/03-orders.png) |

| Drivers | Settings |
|---|---|
| ![Admin drivers](./screenshots/admin/06-drivers.png) | ![Admin settings](./screenshots/admin/10-settings.png) |

全 10 枚は [product gallery](./product-gallery.ja.md#admin) にあります。

## Troubleshooting

| 症状 | 対応 |
|---|---|
| Sign-in に戻る | Local API health と Admin role を確認し、session injection ではなく再 sign-in します。 |
| Locale/route が違う | 適切な `/vi/...`、`/en/...`、または `/ja/...` を開き、locale-preserving navigation を使います。 |
| Error 後に list が空 | Retry して visible error を確認し、failed request を valid empty state と記録しません。 |
| Map unavailable | OpenFreeMap style と backend telemetry を確認し、coordinate/route/ETA を捏造しません。 |
| Export/AI unavailable | 明示的な job/provider state を確認し、placeholder secret や成功 claim を追加しません。 |

## Evidence boundary

Admin PNG/GIF は deterministic seed data の isolated local Docker E2E stack を Google Chrome で capture しました。Manifest は dirty working tree と local runtime images を記録します。Privacy-reviewed product/regression evidence であり、production/release certification ではありません。[capture provenance](./screenshots/README.md) と [full gallery](./product-gallery.ja.md) を参照してください。
