# FoodFlow Product Gallery

言語: [English](product-gallery.md) · [Tiếng Việt](product-gallery.vi.md) · **日本語**

この privacy-reviewed gallery は、local regression media、historical controlled-production web media、bounded Driver production-emulator recovery media の三つを明確にラベル付けして収録します。`docs/screenshots/manifest.json` は source head、capture time、runtime、dirty-working-tree boundary、全 asset の SHA-256 を記録します。画像単体では clean release head、final Docker build、current production journey、physical device、app-store を証明しません。

## Surface coverage

| Surface | Product | Stored visual media | Primary guide | Evidence boundary |
|---|---|---|---|---|
| Admin | Next.js web dashboard | Local PNG 10 枚、GIF 1 件、historical production PNG 1 枚 | [Admin ガイド](./admin-guide.ja.md) | Local Chrome regression と別ラベルの SHA `17584153` controlled-production evidence。Current revision certification ではありません。 |
| Restaurant | Next.js web dashboard | Local PNG 10 枚、GIF 1 件、historical production PNG 1 枚 | [Restaurant ガイド](./restaurant-guide.ja.md) | Local Chrome regression と別ラベルの SHA `17584153` controlled-production evidence。Current public access は Vercel SSO 配下です。 |
| Customer | Flutter/Riverpod native Android/iOS app; Android `customer` flavor | Privacy-reviewed app-launch WebP 1 枚と public-auth GIF 1 件 | [Customer（注文者）ガイド](./customer-guide.ja.md) | Android AVD app-launch/public-auth evidence のみ。Exact coordinates を含む authenticated still は除外しました。 |
| Driver | Flutter/Riverpod native Android/iOS app; Android `driver` flavor | Local WebP 6 枚、production-emulator recovery WebP 1 枚、tracking/permission asset 2 件、GIF 1 件 | [Driver ガイド](./driver-guide.ja.md) | Local Android AVD role/GPS evidence と別ラベルの Railway/Supabase production-emulator capture。Physical device、iOS、FCM、payout、app-store を認証しません。 |

## Role guide を選ぶ

- [Admin](./admin-guide.ja.md): platform operation、support、report、export、settings。
- [Restaurant](./restaurant-guide.ja.md): order queue、menu、staff、revenue、restaurant settings。
- [Customer](./customer-guide.ja.md): discovery、cart、checkout、tracking、Help。
- [Driver](./driver-guide.ja.md): onboarding、Online/GPS、dispatch、earnings、profile。

Customer/Driver に browser URL はありません。正しい Flutter entrypoint を device/emulator で起動し、Admin/Restaurant media を mobile UI として代用しません。

## Motion flows

| Flow | Preview |
|---|---|
| Admin login → overview | ![Admin](media/gifs/admin-login-flow.gif) |
| Restaurant orders → menu | ![Restaurant](media/gifs/restaurant-orders-to-menu.gif) |
| Customer sign-in → registration → sign-in | ![Customer public authentication flow](media/gifs/customer-auth-flow.gif) |
| Driver sign-in → Home → Earnings → Profile | ![Driver flow](media/gifs/driver-role-flow.gif) |

GIF は silent optimized preview です。Admin/Restaurant は review 済み Google Chrome frame を使います。Customer は credential を入力しない public sign-in → registration → sign-in navigation のみを記録します。Driver は privacy-reviewed Android AVD role still 4 枚を使います。いずれも production または mobile release journey の認証ではありません。

## Historical controlled-production web smoke

この Google Chrome 2 枚は deployed revision `17584153ff256b74a3413ae9844f4f27bff038cc` の証拠であり、current runtime `a703ece` の証拠ではありません。Capture 時の Admin overview には synthetic role-smoke user 4 件と temporary restaurant 1 件が表示され、Restaurant queue はその restaurant に scope され order は 0 件でした。その後 cleanup が fixture user、profile、restaurant、order、GPS row をすべて削除しました。Manifest に記録した bounded historical authentication journey のみを示します。

| Authenticated Admin overview | Authenticated Restaurant order queue |
|---|---|
| ![Historical controlled-production Admin](./screenshots/production/2026-07-15-admin-authenticated-overview.png) | ![Historical controlled-production Restaurant](./screenshots/production/2026-07-15-restaurant-authenticated-orders.png) |

## Admin

[Admin ガイド](./admin-guide.ja.md)で sign-in、navigation、role boundary、troubleshooting を確認してください。

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

[Restaurant ガイド](./restaurant-guide.ja.md)で orders、menu、staff permission、settings、troubleshooting を確認してください。

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

Customer は first-class Flutter/Riverpod native Android/iOS product です。[`main_customer.dart`](../mobile/lib/main_customer.dart) から Android `customer` flavor で起動します。documented scope は discovery、ordering、cart、checkout、tracking、support です。利用手順は [Customer（注文者）ガイド](./customer-guide.ja.md)、runtime/build は [mobile guide](../mobile/README.md) を参照してください。

Customer/Driver 共通 workflow、permission、通知動作、実行コマンドは [Customer / Driver モバイルガイド](./customer-driver-guide.ja.md) にあります。

次の privacy-reviewed Android AVD media は app-launch still 1 枚と、credential を入力しない public sign-in → registration → sign-in GIF 1 件です。Exact simulated coordinates を表示した authenticated Home/discovery still は保持しません。Manifest は dirty workspace と記録するため regression/product evidence のみで、release evidence には clean-head recapture が必要です。

![Customer sign-in、registration、return flow](./media/gifs/customer-auth-flow.gif)

![Customer app launch](./screenshots/customer/01-login.webp)

Exact simulated coordinates を表示した authenticated Customer stills は gallery から除外しました。Coordinate-redaction behavior は altered screenshot ではなく mobile regression test で確認します。

## Driver

Driver は first-class Flutter/Riverpod native Android/iOS product です。[`main_driver.dart`](../mobile/lib/main_driver.dart) から Android `driver` flavor で起動します。[Driver ガイド](./driver-guide.ja.md)で sign-in、onboarding、truthful Online、dispatch、earnings、profile を確認し、runtime/build は [mobile guide](../mobile/README.md) を参照してください。

![Driver sign-in、Home、Earnings、Profile flow](./media/gifs/driver-role-flow.gif)

| Sign-in | Home |
|---|---|
| ![Driver sign-in](./screenshots/driver/01-login.webp) | ![Driver Home](./screenshots/driver/02-home.webp) |

| Earnings | Profile |
|---|---|
| ![Driver earnings](./screenshots/driver/03-earnings.webp) | ![Driver profile](./screenshots/driver/04-profile.webp) |

### Local GPS / foreground tracking evidence

Android API 35 の画像は simulated route と deterministic test data のみを使います。Driver の明示的 Online action、notification permission、foreground location notification を示しますが、real location、personal account、credential、token、無関係な personal notification は表示していません。

Historical local E2E は authenticated GPS command を受け取り、Redis liveness を更新し、PostGIS に sample を保存し、authorized Admin Socket.IO listener へ一つの event を送信しました。これは local `socketio` compatibility evidence のみであり、Supabase、Railway、Vercel、production の証拠ではありません。

| Screen | Image |
|---|---|
| Driver Online after GPS verification | ![Driver Online](screenshots/driver/driver-online-gps-e2e.webp) |
| Current Driver Online device smoke | ![Driver Online realtime GPS](screenshots/driver/driver-online-realtime-gps.webp) |
| Foreground-tracking notification permission | ![Driver notification permission](screenshots/gps/driver-notification-permission.webp) |
| Foreground location notification | ![Driver foreground location notification](screenshots/gps/driver-foreground-location-notification.webp) |

### Android API 35 production-emulator recovery

2026-07-15 の別 smoke は temporary synthetic Driver を Android API 35 上で Railway と Supabase に接続しました。明示的 Online 後の foreground tracking、screen-off update、original timestamp を保持した offline buffer/flush、process termination 後の refresh/restart、PostGIS persistence、authorized private Broadcast を検証し、temporary account と GPS row を削除しました。Production backend/provider と emulator の限定 evidence であり、physical device、iOS、FCM、payout、routing、app-store を認証しません。

![Driver after Android production-emulator recovery](./screenshots/driver/driver-online-android-api35-recovery.webp)

## Recapture

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
```

Overlay CORS は `localhost` 用です。`127.0.0.1` は意図的 error-state になります。Script は real API と Google Chrome channel を使い、optimized GIF と intermediate cleanup を行いますが、すべての画像を目視 review します。Release-use capture には source commit、Compose/image reference、clean final head または dirty workspace の区別が必要です。Current manifest は mobile に Android API 35 x86_64 AVD、deterministic seed identity、masked password、fixed simulated GPS、Google Maps API key 未使用を記録します。Admin/Restaurant web map は keyless OpenFreeMap のみを受け入れ、mobile widget を OpenFreeMap と再ラベルしません。

Locale/title/`html lang`、404/`Failed to fetch`/console error、real API data、secret/token exposure、crop/clipping、empty state masquerade を確認します。既存 media は committed release candidate から source/runtime reference 付きで recapture されるまで historical のままです。Dirty workspace の capture は runtime evidence のみで release proof ではありません。

[English gallery](product-gallery.md) · [Testing](testing-guide.ja.md) · [Docker](docker-local-dev-guide.ja.md)
