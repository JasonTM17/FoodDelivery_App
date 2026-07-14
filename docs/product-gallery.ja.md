# FoodFlow Product Gallery

言語: [English](product-gallery.md) · [Tiếng Việt](product-gallery.vi.md) · **日本語**

この gallery の画像/GIF は historical non-production media です。`docs/screenshots/manifest.json` は `capturedAt` 2026-07-10 を記録していますが、source SHA、Compose reference、image reference がありません。そのため current source head、final Docker build、production deploy の証拠にはなりません。

## Surface coverage

| Surface | Product | Stored visual media | Evidence boundary |
|---|---|---|---|
| Admin | Next.js web dashboard | Historical stills and GIF | Non-production web media のみ。 |
| Restaurant | Next.js web dashboard | Historical stills and GIF | Non-production web media のみ。 |
| Customer | Flutter/Riverpod native Android/iOS app; Android `customer` flavor | None | Customer still は未保存。source documentation は visual/release evidence ではありません。 |
| Driver | Flutter/Riverpod native Android/iOS app; Android `driver` flavor | Two test-only Android API 35 assets | Simulated GPS/permission の local evidence のみで、mobile release、Supabase、Railway、production の証拠ではありません。 |

## Motion flows

| Flow | Preview |
|---|---|
| Admin login → overview | ![Admin](media/gifs/admin-login-flow.gif) |
| Restaurant orders → menu | ![Restaurant](media/gifs/restaurant-orders-to-menu.gif) |

## Admin

| Screen | Image |
|---|---|
| Login | ![Admin login](screenshots/admin/01-login.png) |
| Overview | ![Admin overview](screenshots/admin/02-overview.png) |
| Orders | ![Admin orders](screenshots/admin/03-orders.png) |
| Restaurants | ![Admin restaurants](screenshots/admin/04-restaurants.png) |
| Users | ![Admin users](screenshots/admin/05-users.png) |
| Drivers | ![Admin drivers](screenshots/admin/06-drivers.png) |
| Promotions | ![Admin promotions](screenshots/admin/07-promotions.png) |
| Support | ![Admin support](screenshots/admin/08-support.png) |
| Analytics | ![Admin analytics](screenshots/admin/09-analytics.png) |
| Settings | ![Admin settings](screenshots/admin/10-settings.png) |

## Restaurant

| Screen | Image |
|---|---|
| Login | ![Restaurant login](screenshots/restaurant/01-login.png) |
| Dashboard | ![Restaurant dashboard](screenshots/restaurant/02-dashboard.png) |
| Order queue | ![Restaurant orders](screenshots/restaurant/03-orders.png) |
| Menu | ![Restaurant menu](screenshots/restaurant/04-menu.png) |
| Promotions | ![Restaurant promotions](screenshots/restaurant/05-promotions.png) |
| Revenue | ![Restaurant revenue](screenshots/restaurant/06-revenue.png) |
| Reviews | ![Restaurant reviews](screenshots/restaurant/07-reviews.png) |
| Staff | ![Restaurant staff](screenshots/restaurant/08-staff.png) |
| Insights | ![Restaurant insights](screenshots/restaurant/09-insights.png) |
| Settings | ![Restaurant settings](screenshots/restaurant/10-settings.png) |

## Customer

Customer は first-class Flutter/Riverpod native Android/iOS product です。[`main_customer.dart`](../mobile/lib/main_customer.dart) から Android `customer` flavor で起動します。documented scope は discovery、ordering、cart、checkout、tracking、support です。runtime/build の詳細は [mobile guide](../mobile/README.md) を参照してください。

source と照合した Customer/Driver workflow、permission、通知動作、実行コマンドは [Customer / Driver モバイルガイド](./customer-driver-guide.ja.md) にあります。

Customer UI の capture はこの gallery にまだありません。Admin/Restaurant media から Customer screenshot を推測せず、release evidence には source/runtime reference 付きの [`main_customer.dart`](../mobile/lib/main_customer.dart) からの新規 capture だけを使います。

## Driver GPS (test-only local E2E)

Driver は first-class Flutter/Riverpod native Android/iOS product です。[`main_driver.dart`](../mobile/lib/main_driver.dart) から Android `driver` flavor で起動します。documented scope は Online state、dispatch、GPS、route guidance、earnings、KYC、notifications です。runtime/build の詳細は [mobile guide](../mobile/README.md) を参照してください。

Android API 35 の画像は simulated route と deterministic test data のみを使います。Driver の明示的 Online action と notification permission を示しますが、real location、personal account、credential、token は取得していません。

Historical local E2E は authenticated GPS command を受け取り、Redis liveness を更新し、PostGIS に sample を保存し、authorized Admin Socket.IO listener へ一つの event を送信しました。これは local `socketio` compatibility evidence のみであり、Supabase、Railway、Vercel、production の証拠ではありません。

| Screen | Image |
|---|---|
| Driver Online after GPS verification | ![Driver Online](screenshots/driver/driver-online-gps-e2e.webp) |
| Foreground-tracking notification permission | ![Driver notification permission](screenshots/gps/driver-notification-permission.webp) |

## Recapture

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
```

Overlay CORS は `localhost` 用です。`127.0.0.1` は意図的 error-state になります。Script は real API、optimized GIF、intermediate cleanup を行いますが、すべての画像を目視 review します。Release-use capture には source commit、Compose/image reference、clean final head または dirty workspace の区別が必要です。現在の manifest は capture time、origin、seed identity のみを記録します。

Locale/title/`html lang`、404/`Failed to fetch`/console error、real API data、secret/token exposure、crop/clipping、empty state masquerade を確認します。既存 media は committed release candidate から source/runtime reference 付きで recapture されるまで historical のままです。Dirty workspace の capture は runtime evidence のみで release proof ではありません。

[English gallery](product-gallery.md) · [Testing](testing-guide.ja.md) · [Docker](docker-local-dev-guide.ja.md)
