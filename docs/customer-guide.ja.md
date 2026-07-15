# Customer（注文者）ガイド

言語: [English](./customer-guide.md) | [Tiếng Việt](./customer-guide.vi.md) | **日本語**

FoodFlow Customer は Android/iOS 向け Flutter/Riverpod ネイティブ注文アプリです。本書は現在の Customer source と照合した利用ガイドであり、特定の production release、決済、地図、push provider が live であることを保証しません。Customer には Web URL がありません。インストール済みアプリを使用するか、Android customer flavor で [main_customer.dart](../mobile/lib/main_customer.dart) を起動します。

## Customer でできること

| 領域 | 現在の Customer 機能 |
|---|---|
| 探す | 近くのレストラン閲覧、料理検索、レストラン/料理詳細、レストラン結果の絞り込み。 |
| 注文する | 商品と option を cart に追加、メモ・promotion code、配送先選択、現金または wallet 決済。 |
| 注文後 | 進行中/配達済み/キャンセル済みの注文確認、対象注文の追跡、キャンセル依頼、配達済み注文の評価。 |
| アカウント | favorites、vouchers、通知 inbox、wallet、loyalty、referral、住所、Help、アプリ内 AI chat。 |

## クイックスタート

1. レストランを閲覧し、選んだ料理と option を cart に追加します。
2. 保護された cart/checkout に進む前に、サインインまたは登録します。
3. 有効な配送先を確認し、delivery pricing を待ってから cash または wallet を選びます。
4. Checkout は一度だけ送信し、注文確認を待ってから **Orders** を開きます。

これが最短の対応フローです。favorites、vouchers、wallet、loyalty、referral、
通知、Help は任意のアカウント機能であり、checkout に必要な配送先と pricing の
確認を置き換えるものではありません。

## 1. 起動、アカウント、permission

1. Customer を開きます。サインイン前でも Home、検索、レストラン、料理詳細を閲覧できます。
2. **Register** では氏名、email、電話番号、password を入力します。既存 Customer は email/password で **Sign in** します。
3. サインインまたは登録成功後、現行 router は Home を直接開きます。位置情報と通知の permission prompt は機能と端末状態に応じて表示され、拒否時に架空の位置情報や push 成功を作ってはいけません。

### Permission の注意

- 位置情報は近隣レストランと配送コンテキストに役立ちます。Android/iOS の prompt が出ない場合は、許可済みと判断せず端末設定の FoodFlow permission を確認してください。
- 通知は任意です。Firebase 設定がない build でもアプリ内 inbox は使えます。端末 push は有効な session と必要な公開 Firebase metadata がある build でのみ試行されます。
- Push をタップするとローカルの通知 inbox または注文先を開けます。任意の Web link や universal link に対応することは約束しません。

## 2. 料理を探して cart を作る

1. **Home** でレストランを閲覧するか、**Search** を使います。
2. レストランを開いて menu を確認し、料理を開いて利用可能な option を選択して cart に追加します。
3. **Cart** で数量変更、商品削除、商品メモ、利用可能な promotion code の適用ができます。
4. Checkout 前に cart を確認します。価格、在庫、promotion の可否、最終決済結果は画面だけではなく server が確定します。

認証が拒否されても local cart は静かに削除されません。再度サインイン後、内容を確認してから注文してください。

## 3. 配送先と checkout

Delivery pricing の読込完了と配送先選択後に checkout できます。checkout では **cash** または **wallet**、driver 向けメモ、cart の promotion code を選べます。

### Checkout 前の確認

送信前に、次を確認してください。

- レストラン、商品 option、数量、商品メモが正しい。
- 有効な配送先が選択されている。
- delivery pricing が読込中ではなく表示されている。
- cash または wallet の選択が正しい。
- promotion code を使う場合、cart にまだ表示されている。

在庫、価格、voucher、決済、注文状態の理由で server が拒否することがあります。
返された表示を読み、該当する選択を直してください。ボタンを押しただけで注文が
作成されたとは見なさないでください。

### 地図で配送先を選ぶ

新しい住所を追加するときは、label と詳細な住所を入力し、地図をタップして配送先
marker を置きます。point はベトナムの対応 delivery area 内でなければなりません。
配送 API は latitude/longitude も必要とするため、テキストだけでは保存できません。
これにより tracking/dispatch が架空の位置を使うことを防ぎます。

無効な位置と表示されたら、地図で有効な point を選び直してください。checkout を
繰り返し送信しないでください。有効な配送先と delivery price がなければ注文できません。

Checkout 確定後は注文確認を待ちます。API が order ID を返したときだけ cart が空になり追跡が開くため、結果待ちの間に複数画面から同じ注文を送らないでください。

## 4. 注文の追跡、キャンセル、評価

- **Orders** を開くと、進行中、配達済み、キャンセル済みが分かれて表示されます。
- 進行中の注文を選ぶと追跡状態を見られます。有効な配送先/driver 座標がある場合のみ地図と route 情報を表示できます。座標や route がなければ、その状態を表示し route や ETA を作りません。
- 注文画面に表示される場合だけ **Cancel order** を選びます。遅い、気が変わった、注文間違い、その他の理由を送れますが、キャンセル/refund の可否は server が決めます。
- 配達後は review で food と delivery の rating、任意のコメントを送れます。

## 5. Profile、通知、Help

**Profile** から住所、favorites、vouchers、wallet、loyalty、referral、通知 inbox、Help に進めます。

- **Favorites** はもう一度探したいレストランや料理を保存します。
- Voucher、wallet、loyalty は checkout でも server の検証対象です。
- **Notifications** は個々の item の閲覧や既読化ができます。push のリンク先が未対応な場合の安全な fallback です。
- **Help** にはアプリ内 AI chat があります。検証済みの返信または escalation 状態を返しますが、人間の即時対応を約束するものではありません。

### Help を有効に使う

注文の問題では、先に該当注文を開きます。Help には表示中の注文状態、期待した
結果、実際に起きたこと、表示された正確な error があればそれを伝えてください。
chat に password やアカウント credential を送らないでください。これにより support
は注文を推測せずに状況を確認できます。

## トラブルシューティング

| 状態 | 対応 |
|---|---|
| Permission prompt が出ない | 端末設定で FoodFlow の permission を確認し、アプリに戻ります。 |
| 近隣位置または route がない | 位置情報 permission とネットワークを確認します。地図は架空の route/ETA を表示しません。 |
| 住所位置が必要または無効 | 住所を追加し直し、保存前に地図で有効な配送先をタップしてください。 |
| Checkout が進まない | 有効な住所、delivery pricing、決済方法、在庫、voucher を確認します。 |
| 端末 push が来ない | 通知 permission と端末設定を確認します。inbox がアプリ内 fallback で、Firebase は build 依存です。 |
| 注文の help が必要 | 該当注文を開き、Help/AI chat に表示状態またはエラーを伝えます。 |

## Visual と release の境界

![Customer sign-in から registration への flow](./media/gifs/customer-auth-flow.gif)

![Customer app launch](./screenshots/customer/01-login.webp)

Current captures は Android API 35 x86_64 AVD の Flutter debug APK で作成しました。GIF は credential を入力せず、public sign-in から registration へ移動して戻る操作だけを記録しています。Exact simulated coordinates を表示した authenticated Customer stills は docs から除外しました。Retained dirty-working-tree media は privacy-reviewed regression/product evidence であり、mobile release、payment、map/routing、Firebase、Supabase/Railway、production の証拠ではありません。

runtime、設定、build command は [Customer / Driver モバイルガイド](./customer-driver-guide.ja.md) と [mobile README](../mobile/README.md) を参照してください。
