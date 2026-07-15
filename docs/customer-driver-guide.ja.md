# Customer / Driver モバイルガイド

言語: [English](./customer-driver-guide.md) | [Tiếng Việt](./customer-driver-guide.vi.md) | **日本語**

FoodFlow には、Admin Web だけでなく **Customer** と **Driver** の独立した
native mobile アプリがあります。このガイドは現在の Flutter router と screen に
基づきます。これは source の利用ガイドであり、production provider や mobile
release の承認を意味しません。

## 正しいアプリを選ぶ

| 製品 | 利用者 | Android package/flavor | Entrypoint |
|---|---|---|---|
| Customer | 注文する顧客 | `vn.foodflow.customer` / `customer` | [`main_customer.dart`](../mobile/lib/main_customer.dart) |
| Driver | 本人確認済みの配達員 | `vn.foodflow.driver` / `driver` | [`main_driver.dart`](../mobile/lib/main_driver.dart) |

両方とも認証済み NestJS API を使用します。managed production では scoped
Supabase Realtime credential 経由の allow-list event を受信します。Socket.IO は
明示的な local/self-hosted 用だけです。Customer/Driver にブラウザで開く Web URL
はありません。

## Role guide

注文手順、permission、住所制限、checkout、追跡、Help は独立した
[Customer（注文者）ガイド](./customer-guide.ja.md) を参照してください。本書は
Driver sign-in、Online/GPS、dispatch、earnings、profile は
[Driver ガイド](./driver-guide.ja.md) を参照してください。本書は共通の
mobile/runtime overview として残します。

## Customer の流れ

1. **起動とログイン。** splash の後、認証済み Customer route を使います。新規利用者も
   登録でき、現行 auth routing はサインインと登録の両方を Home に直接送ります。位置情報と
   通知の prompt は関連機能と端末側の flow で処理され、認証後の必須 onboarding chain では
   ありません。permission を拒否してもよく、アプリは制限された実際の状態を示し、位置や
   push 成功を捏造しません。
2. **料理を探す。** Home、search、restaurant list/filter、restaurant detail、food
   detail から cart へ進みます。favorites と vouchers は認証済み Customer route です。
3. **Cart と checkout。** Checkout には配達先 address の選択が必要です。選択 address、
   支払方法、任意 note、cart の promotion code を API に送ります。現在の UI は cash と
   wallet を提供しますが、在庫、価格、promotion、決済結果の最終判断は server です。
4. **注文を追跡。** Checkout 成功後は order tracking を開きます。正しい order の detail
   を読み、認証済み tracking を開始し、画面を閉じると停止します。map camera/route は
   有効な点だけを使い、client は直線 route や ETA を勝手に作りません。
5. **完了とサポート。** Order history から tracking と review に進めます。Cancel は理由と
   任意 note を送信しますが、cancel/refund を認めるかは server が決めます。Profile には
   addresses、wallet、loyalty、referral、favorites、notifications、help/chat があります。

### Customer 通知

有効な Customer session 後、public Firebase build metadata がある場合だけ通知 permission
と FCM token registration を要求できます。push tap は notifications または orders の
local destination だけを受け入れます。未対応 link は app 内 inbox に戻ります。Firebase
設定がない場合は FCM registration だけを無効にし、push 成功を偽装しません。

## Driver の流れ

1. **ログインと onboarding。** 現行 terms を未承諾の Driver は agreement へ進みます。
   未確認の Driver は vehicle、documents、KYC の順に進みます。KYC は typed data と
   private upload grant を使用します。signed upload URL や credential をアプリに貼りません。
2. **実 GPS で Online。** Driver home の Online control は fresh location sample を取得し、
   API の availability accept/reject を待ちます。stale GPS や失敗時に、switch を押しただけで
   Online 表示にしてはいけません。
3. **Dispatch を処理。** 認可された offer は dismiss 不可の accept/reject dialog を開きます。
   accept 後は delivery flow、pickup confirmation、delivery completion を進みます。route
   geometry/ETA は受理された backend data を使い、ない場合は unavailable を表示します。
4. **アカウントを運用。** delivery history/detail、earnings、incentives、heatmap、ratings、
   bank account、support、settings、offline status は Driver 専用の認証 route です。Admin や
   Restaurant の権限を置き換えるものではありません。

### Driver 通知

Driver inbox は認証 route であり、開いている間は許可された realtime stream を notification
ID で重複排除します。push tap は Driver auth が許す後に notifications、earnings、profile
だけに遷移します。session restore 中の tap は認証解決まで保留し、不明 destination は inbox
に戻ります。

## Emulator / device で実行

開発機上の local API を Android emulator から使う場合は `10.0.2.2` を使います。実機では
開発機の到達可能な LAN address を使います。

```powershell
cd mobile
flutter pub get --enforce-lockfile

flutter run --flavor customer -t lib/main_customer.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio

flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

Managed production では verified provider alias と `REALTIME_PROVIDER=supabase`
を使います。Firebase validation には選択 flavor と一致する四つの public `FIREBASE_*` が
必要です。FCM service account、Supabase service-role、database URL、signing secret を
Dart define に入れてはいけません。詳しい setup、Android build、troubleshooting は
[mobile README](../mobile/README.md) を参照してください。

## Visual と release の境界

| Customer app launch | Active-delivery Driver Home |
|---|---|
| ![Customer app launch](./screenshots/customer/01-login.webp) | ![Driver Home](./screenshots/driver/02-home.webp) |

Gallery には current Customer/Driver role stills と以前の local GPS/permission
captures があります。Isolated E2E stack 接続の Android AVD、deterministic seed
identity、masked password、dirty working tree を使いました。Role capture は fixed
simulated GPS を使い、Google Maps API key は使っていません。Privacy-reviewed
regression/product evidence であり、mobile release、payment、dispatch、routing、
background location、provider、production の証拠ではありません。Clean-head visual
record には [capture procedure](./product-gallery.ja.md#recapture) を使います。

関連: [product requirements](./project-overview-pdr.ja.md)、
[testing guide](./testing-guide.ja.md)、[product gallery](./product-gallery.ja.md)。
