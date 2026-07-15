# Driver ガイド

言語: [English](./driver-guide.md) | [Tiếng Việt](./driver-guide.vi.md) | **日本語**

FoodFlow Driver は Android/iOS 向け Flutter/Riverpod native 配達アプリです。本書は現在の authenticated routes と Driver shell に基づき、mobile release、live dispatch provider、production background-location matrix の認証を意味しません。

## 前提

- [main_driver.dart](../mobile/lib/main_driver.dart) から Driver flavor を install/run します。
- 必要な agreement/verification state の Driver account を使います。Local capture は deterministic seed identity を使い、password は mask され docs に記載しません。
- Online/dispatch test のときだけ location を有効にします。Fresh location と authenticated API command が成功するまで Online 表示にしてはいけません。

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

実機では Android emulator host `10.0.2.2` の代わりに、開発機の到達可能な LAN address を使います。

## Sign in して Home へ

1. Driver email/password を入力し、一度だけ送信します。
2. Current terms が未承諾なら agreement、verification が必要なら vehicle/document/KYC を完了します。
3. Ready Driver は **Home** に着きます。Active delivery 中は GPS sharing が active か resume 必要かを表示し、switch は実際の Online availability を示します。
4. 三つの main tab、**Home**、**Earnings**、**Profile** を使います。

## Online と delivery

1. **Home** で Online control を有効にします。
2. 必要な location/foreground notification permission を許可します。App は Online request 前に fresh device location を取得します。
3. API confirmation を待ちます。Stale/failed GPS や rejected command は正しい Offline state を維持します。
4. 認可済み dispatch offer は accept/reject dialog を開きます。配達可能な場合だけ accept します。
5. Delivery flow、pickup confirmation、completion を進みます。Route geometry/ETA は受理済み backend data だけを使い、ない場合は unavailable のままにします。
6. Shift 終了時は Offline に戻し、foreground tracking を停止します。

Local role capture は fixed simulated GPS を使い、Google Maps API key は使っていません。これは capture の事実であり、mobile map provider や live routing の認証ではありません。Admin/Restaurant web map は別途 keyless OpenFreeMap を使い、mobile widget を OpenFreeMap と再ラベルしません。

## Earnings、history、profile

- **Earnings** は today/week/month summary と API の history を表示します。
- **Home** は今日の earnings、order count、online time、rating、active work、recent orders を表示します。
- **Profile** は Driver/vehicle summary、rating/totals、language、sign-out を含みます。他の authenticated route には delivery history/detail、incentives、heatmap、ratings、bank account、notifications、support、settings があります。
- Screenshot の value は deterministic local seed data で、実在人物、payout、production balance ではありません。

## Visual reference

| Sign-in | Active-delivery Home |
|---|---|
| ![Driver sign-in](./screenshots/driver/01-login.webp) | ![Driver Home](./screenshots/driver/02-home.webp) |

| Earnings | Profile |
|---|---|
| ![Driver earnings](./screenshots/driver/03-earnings.webp) | ![Driver profile](./screenshots/driver/04-profile.webp) |

[Product gallery](./product-gallery.ja.md#driver) には isolated E2E stack の local GPS/foreground tracking evidence もあります。

## Troubleshooting

| 症状 | 対応 |
|---|---|
| Login に戻る | API reachability と Driver role を確認し、別 role token を inject/reuse しません。 |
| Agreement/KYC へ移動 | 必要な onboarding を完了し、copied URL で route を迂回しません。 |
| Online にできない | Location permission、fresh GPS、network、API response を確認し、failure 時は Offline を維持します。 |
| Offer がない | Online の server acceptance と realtime provider connection を確認し、offer を捏造しません。 |
| Route/ETA がない | 有効な backend data を待ち、straight-line fallback や ETA を作りません。 |
| Device push がない | Notification permission と build-specific Firebase metadata を確認し、authenticated inbox を fallback にします。 |

## Evidence boundary

4 枚の Driver role still は isolated local E2E stack 接続の Android API 35 x86_64 AVD で capture しました。Flutter debug APK は current dirty working tree から build し、deterministic seed data と masked password を使用します。Privacy-reviewed regression/product evidence であり、mobile release、background location、payout、dispatch、Supabase/Railway、production certification ではありません。[capture provenance](./screenshots/README.md) と [mobile overview](./customer-driver-guide.ja.md) を参照してください。
