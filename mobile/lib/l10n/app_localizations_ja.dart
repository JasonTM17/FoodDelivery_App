// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get loginTitle => 'ログイン';

  @override
  String get loginWelcomeBack => 'おかえりなさい';

  @override
  String get emailLabel => 'メールアドレス';

  @override
  String get emailHint => 'メールアドレスを入力してください';

  @override
  String get emailRequired => 'メールアドレスを入力してください';

  @override
  String get emailInvalid => 'メールアドレスが無効です';

  @override
  String get passwordLabel => 'パスワード';

  @override
  String get passwordHint => 'パスワードを入力してください';

  @override
  String get passwordRequired => 'パスワードを入力してください';

  @override
  String get passwordMinLength => 'パスワードは6文字以上必要です';

  @override
  String get forgotPassword => 'パスワードを忘れた方';

  @override
  String get forgotPasswordTitle => 'パスワードを忘れた方';

  @override
  String get forgotPasswordContent => 'メールにてサポートにご連絡ください。';

  @override
  String get close => '閉じる';

  @override
  String get loginButton => 'ログイン';

  @override
  String get noAccount => 'アカウントをお持ちでない方';

  @override
  String get registerLink => '登録';

  @override
  String get registerAsDriver => 'ドライバーとして登録';

  @override
  String get registerTitle => '登録';

  @override
  String get registerCreateAccount => '新しいアカウントを作成';

  @override
  String get registerSubtitle => 'FoodFlowを始めるには情報を入力してください';

  @override
  String get fullNameLabel => '氏名';

  @override
  String get fullNameHint => '氏名を入力してください';

  @override
  String get fullNameRequired => '氏名を入力してください';

  @override
  String get fullNameMinLength => '名前は2文字以上必要です';

  @override
  String get phoneLabel => '電話番号';

  @override
  String get phoneHint => '電話番号を入力してください';

  @override
  String get phoneRequired => '電話番号を入力してください';

  @override
  String get phoneInvalid => '無効な電話番号です';

  @override
  String get passwordHintLong => 'パスワードを入力（6文字以上）';

  @override
  String get confirmPasswordLabel => 'パスワードの確認';

  @override
  String get confirmPasswordHint => 'パスワードを再入力してください';

  @override
  String get confirmPasswordRequired => 'パスワードを確認してください';

  @override
  String get passwordMismatch => 'パスワードが一致しません';

  @override
  String get registerAs => '登録の種類を選択してください';

  @override
  String get roleCustomer => 'お客様';

  @override
  String get roleDriver => 'ドライバー';

  @override
  String get registerButton => '登録';

  @override
  String get hasAccount => 'すでにアカウントをお持ちの方';

  @override
  String get greetingAnonymous => 'こんにちは！';

  @override
  String greetingNamed(String name) {
    return 'こんにちは、$nameさん！';
  }

  @override
  String get homeQuestion => '今日は何を食べますか？';

  @override
  String get locating => '位置情報を取得中...';

  @override
  String get searchHint => '料理、レストランを検索...';

  @override
  String get nearbyRestaurants => '近くのレストラン';

  @override
  String get viewAll => 'すべて表示';

  @override
  String get loadingRestaurants => '近くのレストランを検索中...';

  @override
  String get noRestaurantsTitle => 'レストランが見つかりません';

  @override
  String get noRestaurantsSubtitle => '検索エリアを広げてみてください';

  @override
  String get reload => '再読み込み';

  @override
  String get navHome => 'ホーム';

  @override
  String get navSearch => '検索';

  @override
  String get navCart => 'カート';

  @override
  String get navOrders => '注文';

  @override
  String get navProfile => 'プロフィール';

  @override
  String get navEarnings => '収益';

  @override
  String get cuisineAll => 'すべて';

  @override
  String get cuisineFastFood => 'ファストフード';

  @override
  String get cuisineVietnamese => 'ベトナム料理';

  @override
  String get cuisineJapanese => '日本料理';

  @override
  String get cuisineKorean => '韓国料理';

  @override
  String get cuisineChinese => '中華料理';

  @override
  String get cuisineItalian => 'イタリア料理';

  @override
  String get cuisineDessert => 'デザート';

  @override
  String get cuisineDrinks => 'ドリンク';

  @override
  String get profileTitle => 'プロフィール';

  @override
  String get defaultUser => 'ユーザー';

  @override
  String get statsOrders => '注文';

  @override
  String get statsReviews => 'レビュー';

  @override
  String get statsAddresses => '住所';

  @override
  String get statsPoints => 'ポイント';

  @override
  String get myAddresses => 'マイアドレス';

  @override
  String get myAddressesSubtitle => '配送先住所を管理';

  @override
  String get profileLoyalty => 'ポイントリワード';

  @override
  String get profileLoyaltySubtitle => 'ポイント確認と引き換え';

  @override
  String get profileWallet => 'マイウォレット';

  @override
  String get profileWalletSubtitle => '残高と取引履歴';

  @override
  String get profileReferral => '友達を招待';

  @override
  String get profileReferralSubtitle => '紹介してリワード獲得';

  @override
  String get profileHelp => 'ヘルプ & FAQ';

  @override
  String get profileHelpSubtitle => 'よくある質問と問い合わせ';

  @override
  String get paymentMethods => '支払い方法';

  @override
  String get paymentMethodsSubtitle => '支払い方法を追加または変更';

  @override
  String get notificationsTitle => '通知';

  @override
  String get notificationsSubtitle => 'プッシュ通知を管理';

  @override
  String get notificationsReadAll => 'すべて既読';

  @override
  String get notificationsAll => 'すべて';

  @override
  String get notificationsOrders => '注文';

  @override
  String get notificationsPromotions => 'プロモーション';

  @override
  String get notificationsSystem => 'システム';

  @override
  String get notificationsEmptyTitle => '通知はありません';

  @override
  String get notificationsEmptySubtitle => 'まだ通知はありません。';

  @override
  String get favorites => 'お気に入り';

  @override
  String get favoritesSubtitle => 'お気に入りの料理一覧';

  @override
  String get support => 'サポート';

  @override
  String get supportSubtitle => 'ヘルプセンター';

  @override
  String get aboutApp => 'FoodFlowについて';

  @override
  String get aboutSubtitle => 'バージョン 1.0.0';

  @override
  String get logout => 'ログアウト';

  @override
  String get logoutConfirm => 'ログアウトしてもよろしいですか？';

  @override
  String get cancel => 'キャンセル';

  @override
  String get commonRetry => '再試行';

  @override
  String get commonErrorTitle => '問題が発生しました';

  @override
  String get commonErrorMessage => 'もう一度お試しください。';

  @override
  String get commonEmptyTitle => 'データがありません';

  @override
  String get restaurantClosed => '営業時間外';

  @override
  String get foodSoldOut => '売り切れ';

  @override
  String get driverProfileTitle => 'プロフィール';

  @override
  String get defaultDriver => 'ドライバー';

  @override
  String get vehicleInfo => '車両情報';

  @override
  String get vehicleType => '車両タイプ';

  @override
  String get vehiclePlate => 'ナンバープレート';

  @override
  String get statistics => '統計';

  @override
  String get totalDeliveries => '配達総数';

  @override
  String get totalEarnings => '総収益';

  @override
  String get languageTitle => '言語';

  @override
  String get languageVi => 'Tiếng Việt';

  @override
  String get languageEn => 'English';

  @override
  String get languageJa => '日本語';

  @override
  String get orderStatusPending => '保留中';

  @override
  String get orderStatusConfirmed => '確認済み';

  @override
  String get orderStatusPreparing => '準備中';

  @override
  String get orderStatusPickedUp => '配達中';

  @override
  String get orderStatusDelivered => '配達完了';

  @override
  String get orderStatusCancelled => 'キャンセル済み';

  @override
  String get cartTitle => 'カート';

  @override
  String get cartEmpty => 'カートは空です';

  @override
  String get cartEmptySubtitle => '料理を追加してください';

  @override
  String get cartClearTitle => 'カートをクリアしますか？';

  @override
  String get cartClearContent => 'カート内のすべてのアイテムを削除してもよろしいですか？';

  @override
  String get cartKeep => 'そのまま';

  @override
  String get cartClearAll => 'すべて削除';

  @override
  String get cartPromoCode => 'プロモコード';

  @override
  String get cartPromoHint => '割引コードを入力';

  @override
  String get cartPromoRemove => '削除';

  @override
  String get cartPromoApply => '適用';

  @override
  String cartPromoApplied(String code) {
    return 'コード $code を適用しました';
  }

  @override
  String get cartSubtotal => '小計';

  @override
  String get cartDeliveryFee => '配達料';

  @override
  String get cartDeliveryFeeLoading => 'サーバーから取得中…';

  @override
  String get cartDeliveryFeeUnavailable => '未取得';

  @override
  String get cartFreeDelivery => '無料';

  @override
  String get cartDiscountLabel => '割引';

  @override
  String get cartGrandTotal => '合計';

  @override
  String get cartViewCart => 'カートを見る';

  @override
  String get cartDelete => '削除';

  @override
  String get checkoutTitle => 'チェックアウト';

  @override
  String get checkoutDeliveryAddress => '配達先住所';

  @override
  String get checkoutNoAddress => '住所がありません';

  @override
  String get checkoutNoAddressSubtitle => '注文を続けるには住所を追加してください';

  @override
  String get checkoutAddAddress => '新しい住所を追加';

  @override
  String get checkoutPaymentMethod => '支払い方法';

  @override
  String get checkoutPaymentCash => '現金';

  @override
  String get checkoutPaymentCashSubtitle => '配達時に支払い';

  @override
  String get checkoutPaymentWallet => '電子ウォレット';

  @override
  String get checkoutNoteForDriver => 'ドライバーへのメモ';

  @override
  String get checkoutNoteHint => 'メモを追加...';

  @override
  String get checkoutOrderSummary => '注文概要';

  @override
  String get checkoutSelectAddress => '配達先住所を選択してください';

  @override
  String get checkoutOrderFailed => '注文に失敗しました';

  @override
  String get addressDefault => 'デフォルト';

  @override
  String get restaurantListTitle => '近くのお店';

  @override
  String get restaurantViewList => 'リスト';

  @override
  String get restaurantViewMap => 'マップ';

  @override
  String get restaurantNoResults => 'レストランが見つかりません';

  @override
  String get restaurantNoResultsSubtitle => '別のフィルターをお試しください';

  @override
  String get restaurantLocationRequired => '近くのレストランを探すには位置情報を許可してください。';

  @override
  String get restaurantLoadFailed => 'レストランを読み込めません。もう一度お試しください。';

  @override
  String get restaurantDetailLoadFailed => 'レストラン情報を読み込めません。もう一度お試しください。';

  @override
  String get restaurantMenuLoadFailed => 'メニューを読み込めません。もう一度お試しください。';

  @override
  String get restaurantMenuTab => 'メニュー';

  @override
  String get restaurantReviewsTab => 'レビュー';

  @override
  String get restaurantInfoTab => '情報';

  @override
  String get restaurantMenuEmpty => 'メニュー更新中';

  @override
  String get restaurantMenuEmptySubtitle => 'このレストランにはまだメニューがありません';

  @override
  String get restaurantNoReviews => 'レビューはまだありません';

  @override
  String get restaurantInfoTitle => 'レストラン情報';

  @override
  String get restaurantReviewFood => '料理';

  @override
  String get restaurantReviewDelivery => '配達';

  @override
  String get restaurantReviewCountLabel => 'レビュー';

  @override
  String get foodPopular => '人気';

  @override
  String get foodSpecialNote => '特別なリクエスト';

  @override
  String get foodNoteHint => '例：ネギなし、辛さ控えめ...';

  @override
  String get foodRequired => '(必須)';

  @override
  String get foodAddToCart => 'カートに追加';

  @override
  String get trackingOrderStatus => '注文状況';

  @override
  String get trackingStepPending => '確認待ち';

  @override
  String get trackingStepPreparing => '準備中';

  @override
  String get trackingStepDelivering => '配達中';

  @override
  String get trackingStepDelivered => '配達完了';

  @override
  String get trackingOrderInProgress => '注文を配達中です';

  @override
  String get trackingCallDriver => '電話';

  @override
  String get trackingMessageDriver => 'メッセージ';

  @override
  String get trackingMarkerRestaurant => 'レストラン';

  @override
  String get trackingMarkerDriver => '配達員';

  @override
  String get trackingMarkerDestination => '配達先';

  @override
  String get orderHistoryTitle => '注文一覧';

  @override
  String orderHistoryTabActive(int count) {
    return '進行中 ($count)';
  }

  @override
  String orderHistoryTabCompleted(int count) {
    return '完了 ($count)';
  }

  @override
  String orderHistoryTabCancelled(int count) {
    return 'キャンセル ($count)';
  }

  @override
  String get orderHistoryNoActive => '進行中の注文はありません';

  @override
  String get orderHistoryNoCompleted => '完了した注文はありません';

  @override
  String get orderHistoryNoCancelled => 'キャンセルした注文はありません';

  @override
  String get orderHistoryEmptySubtitle => '注文がここに表示されます';

  @override
  String get orderHistoryTrack => '追跡';

  @override
  String get addressManagementTitle => 'マイアドレス';

  @override
  String get addressAdd => '住所を追加';

  @override
  String get addressLoading => '住所を読み込み中...';

  @override
  String get addressEmpty => '住所が登録されていません';

  @override
  String get addressEmptySubtitle => '注文するには住所を追加してください';

  @override
  String get addressSetDefault => 'デフォルトに設定';

  @override
  String get addressEdit => '編集';

  @override
  String get addressDeleteTitle => '住所を削除しますか？';

  @override
  String addressDeleteContent(String label) {
    return '「$label」を削除しますか？';
  }

  @override
  String get addressAddSuccess => '住所を追加しました';

  @override
  String get addressUpdateSuccess => '住所を更新しました';

  @override
  String get addressDeleteSuccess => '住所を削除しました';

  @override
  String get addressSave => '保存';

  @override
  String get addressLabelField => 'ラベル';

  @override
  String get addressFieldLabel => '住所';

  @override
  String get addressFieldHint => '詳細な住所を入力';

  @override
  String get addressRequired => '住所を入力してください';

  @override
  String get addressAddDialogTitle => '新しい住所を追加';

  @override
  String get addressEditDialogTitle => '住所を編集';

  @override
  String get addressAddFailed => '住所を追加できません';

  @override
  String get addressLocationRequired => '地図で有効な位置を選択してください。';

  @override
  String get addressLocationInvalid => '住所の位置が無効です。地図でもう一度選択してください。';

  @override
  String get addressUpdateFailed => '住所を更新できません';

  @override
  String get addressDeleteFailed => '住所を削除できません';

  @override
  String get addressDeleteAction => '削除';

  @override
  String get addressHomeLabel => '自宅';

  @override
  String get addressWorkLabel => '職場';

  @override
  String get addressOtherLabel => 'その他';

  @override
  String get supportConnecting => '接続中...';

  @override
  String get supportDriverOnline => 'オンライン';

  @override
  String get supportAiHeader => 'AIサポート — よくある質問に素早く回答';

  @override
  String get supportNoMessages => 'メッセージはまだありません';

  @override
  String get supportNoMessagesSubtitle => '最初のメッセージを送って会話を始めましょう';

  @override
  String get supportMessageHint => 'メッセージを入力...';

  @override
  String get reviewTitle => '注文を評価する';

  @override
  String get reviewFoodQuality => '料理の品質';

  @override
  String get reviewDeliveryQuality => '配達の品質';

  @override
  String get reviewComment => 'コメント';

  @override
  String get reviewCommentHint => '料理と配達サービスについての感想を共有してください...';

  @override
  String get reviewSubmit => 'レビューを送信';

  @override
  String get reviewSuccess => 'レビューを送信しました！';

  @override
  String get reviewError => 'エラーが発生しました。再度お試しください。';

  @override
  String get reviewRatingExcellent => '最高！';

  @override
  String get reviewRatingGood => '良い';

  @override
  String get reviewRatingAverage => '普通';

  @override
  String get reviewRatingPoor => '悪い';

  @override
  String get reviewRatingBad => '非常に悪い';

  @override
  String get driverDashboardToday => '今日';

  @override
  String get driverDashboardOrders => '最近の注文';

  @override
  String get driverDashboardNoOrders => '注文はまだありません';

  @override
  String get driverActiveOrderTitle => '進行中の注文';

  @override
  String get driverStatEarnings => '収益';

  @override
  String get driverStatOnline => 'オンライン';

  @override
  String get driverStatusTitle => '稼働ステータス';

  @override
  String get driverStatusPauseTitle => '注文受付を一時停止';

  @override
  String get driverStatusPauseSubtitle => '指定した時間だけ一時停止し、その後自動でオンラインに戻ります。';

  @override
  String driverStatusPauseMinutes(int minutes) {
    return '$minutes分';
  }

  @override
  String driverStatusPauseHours(int hours) {
    return '$hours時間';
  }

  @override
  String get driverStatusResumeNow => '今すぐ注文受付を再開';

  @override
  String get driverStatusToday => '今日';

  @override
  String get driverStatusOnlineTime => 'オンライン時間';

  @override
  String driverStatusDurationMinutes(int minutes) {
    return '$minutes分';
  }

  @override
  String driverStatusDurationHoursMinutes(int hours, int minutes) {
    return '$hours時間$minutes分';
  }

  @override
  String get driverStatusInfoText => 'オンライン中は、稼働エリア内の新しい注文通知を受け取ります。';

  @override
  String get driverEarningsTitle => '収益';

  @override
  String get driverEarningsPeriodToday => '今日';

  @override
  String get driverEarningsPeriodWeek => '今週';

  @override
  String get driverEarningsPeriodMonth => '今月';

  @override
  String get driverEarningsTotal => '総収益';

  @override
  String get driverEarningsAverage => '1件あたり平均';

  @override
  String get driverEarningsHistory => '配達履歴';

  @override
  String get driverEarningsEmpty => '収益データはまだありません';

  @override
  String get driverEarningsChartError => '収益チャートを読み込めません';

  @override
  String get driverEarningsChartRetry => '再試行';

  @override
  String get driverRatingsTitle => '評価履歴';

  @override
  String get driverRatingsAll => 'すべて';

  @override
  String driverRatingsStars(int count) {
    return '$countつ星';
  }

  @override
  String get driverRatingsEmpty => '評価はまだありません';

  @override
  String get driverRatingsError => '現在、評価を読み込めません。';

  @override
  String get driverRatingsRetry => '再試行';

  @override
  String driverRatingsOrder(String code) {
    return '注文: $code';
  }

  @override
  String get driverRatingsToday => '今日';

  @override
  String get driverRatingsYesterday => '昨日';

  @override
  String get driverTripDetailTitle => '配達詳細';

  @override
  String get driverTripDetailSegments => 'ルート手順';

  @override
  String get driverTripDetailRetry => '再試行';

  @override
  String get driverTripDetailNoRoute => 'この配達のルートデータはまだありません';

  @override
  String get driverTripDetailLoadError => '配達ルートを読み込めません';

  @override
  String driverTripDetailOrder(String code) {
    return '注文: $code';
  }

  @override
  String get driverTripSummaryDistance => '距離';

  @override
  String get driverTripSummaryDuration => '時間';

  @override
  String get driverTripSummaryAvgSpeed => '平均速度';

  @override
  String get driverTripSummaryEarnings => '収益';

  @override
  String get driverTripSummaryCustomerRating => '顧客評価';

  @override
  String driverTripSummaryMinutes(int minutes) {
    return '$minutes分';
  }

  @override
  String get driverRouteReplayTooltip => 'ルートを再生';

  @override
  String get driverRouteReplayPlaying => '再生中...';

  @override
  String get driverRouteReplayReady => 'タップして再生';

  @override
  String get driverRouteReplayCompleted => '再生が完了しました';

  @override
  String get driverRouteReplayEstimated => '予定ルートのみ — GPS再生は利用できません';

  @override
  String get driverRouteReplayEstimatedTooltip => 'この配達のGPSテレメトリは利用できません';

  @override
  String get driverKycTitle => 'KYC認証';

  @override
  String get driverKycUploadTitle => '書類をアップロード';

  @override
  String get driverKycUploadSubtitle => '必要な書類をすべてアップロードしてください';

  @override
  String get driverKycCccdFront => '身分証明書（表面）';

  @override
  String get driverKycCccdBack => '身分証明書（裏面）';

  @override
  String get driverKycDriverLicense => '運転免許証';

  @override
  String get driverKycVehicleReg => '車両登録証';

  @override
  String get driverKycTakePhoto => '写真を撮る';

  @override
  String get driverKycGallery => 'ライブラリから選択';

  @override
  String get driverKycUploadHint => '写真を撮るかアップロード';

  @override
  String get driverKycSubmit => '申請を送信';

  @override
  String get driverKycNote => '申請は24〜48時間で審査されます。承認されたら通知が届きます。';

  @override
  String get driverKycSubmitFailed => '申請を送信できませんでした。もう一度お試しください。';

  @override
  String get driverHistoryTitle => '配達履歴';

  @override
  String get driverHistoryFilterDate => '日付でフィルター';

  @override
  String get driverHistoryEmpty => '配達履歴はありません';

  @override
  String get driverHistoryLoadError => '配達履歴を読み込めません。もう一度お試しください。';

  @override
  String get driverHistoryRetry => '再試行';

  @override
  String get driverHistoryOrderNumberLabel => '注文';

  @override
  String get driverHistoryDeliveryAddressLabel => '配達先住所';

  @override
  String get driverHistoryNoteLabel => 'メモ';

  @override
  String get driverHistoryDeliveryFee => '配達料';

  @override
  String get locationPermissionTitle => '位置情報へのアクセスを許可';

  @override
  String get locationPermissionSubtitle =>
      'FoodFlowは近くのレストランを探し、正確に配達するためにあなたの位置情報が必要です。';

  @override
  String get locationPermissionAllow => '許可する';

  @override
  String get locationPermissionManual => '住所を手動で入力';

  @override
  String get driverNavTitle => '配達';

  @override
  String get driverNavNoOrder => '現在進行中の注文はありません';

  @override
  String get driverNavRestaurant => 'レストラン';

  @override
  String get driverNavCallRestaurant => 'レストランに電話';

  @override
  String get driverNavDeliveryAddress => '配達先住所';

  @override
  String get driverNavArrivedAtRestaurant => 'レストランに到着';

  @override
  String get driverNavPreparingFood => '料理準備中';

  @override
  String get driverNavItemsToPickup => '受け取る商品';

  @override
  String get driverNavConfirmPickup => '受け取り確認';

  @override
  String get driverNavEta => 'ETA - 到着予定時刻';

  @override
  String driverNavEtaMinutes(int minutes) {
    return '約$minutes分';
  }

  @override
  String get driverNavEtaUnavailable => 'ルートETAを待っています';

  @override
  String get driverNavCustomerAddress => 'お客様の住所';

  @override
  String get driverNavCallCustomer => 'お客様に電話';

  @override
  String get driverNavConfirmDelivery => '配達完了';

  @override
  String get driverNavDeliverySuccess => '配達成功！';

  @override
  String get driverNavOrderTotal => '注文合計';

  @override
  String get driverNavYouEarned => 'あなたの収益';

  @override
  String get driverNavGoHome => 'ホームへ戻る';

  @override
  String get driverPickupTitle => '受け取り確認';

  @override
  String get driverPickupRestaurantNoteTitle => 'レストランからのメモ';

  @override
  String get driverPickupHint => '確認前にすべての商品を確認してください';

  @override
  String get driverPickupReportIssue => '問題を報告';

  @override
  String get driverPickupReportSupportMessage => 'サポートにすぐ接続します。';

  @override
  String get driverPickupMissingTitle => '確認できる注文データがありません。';

  @override
  String get driverPickupMissingDescription => '進行中の注文からこの画面を開いてください。';

  @override
  String get driverDeliveryCompleteSubtitle => '配達完了ありがとうございます';

  @override
  String get driverDeliveryTripEarnings => 'この配達の収益';

  @override
  String get driverDeliveryBonus => 'ボーナス';

  @override
  String get driverDeliveryContinue => '次の注文を受ける';

  @override
  String get driverDeliveryMissingTitle => 'この配達の収益データがありません。';

  @override
  String get driverDeliveryMissingDescription => '完了した注文からこの画面を開いてください。';

  @override
  String get driverNavPhoneError => '電話アプリを開けません';

  @override
  String get driverNavOpenDirections => '経路を開く';

  @override
  String get driverNavDirectionsUnavailable => 'この地点への経路を利用できません';

  @override
  String get driverDispatchNewOrderTitle => '新しい注文！';

  @override
  String get driverDispatchNewOrderSubtitle => '承諾して配達を開始';

  @override
  String get driverDispatchRestaurantLabel => 'レストラン';

  @override
  String get driverDispatchDeliveryLabel => '配達先';

  @override
  String driverDispatchCountdownDecision(int seconds) {
    return '判断まであと$seconds秒';
  }

  @override
  String get driverDispatchCountdownUrgent => 'まもなく時間切れです！';

  @override
  String get driverDispatchReject => '拒否';

  @override
  String get driverDispatchAccept => '注文を承諾';

  @override
  String get cartPlaceOrder => '注文する';

  @override
  String get checkoutConfirmOrder => '注文を確定';

  @override
  String get onboardingSkip => 'スキップ';

  @override
  String get onboardingNext => '次へ';

  @override
  String get onboardingGetStarted => '始める';

  @override
  String get onboardingWelcomeTitle => 'FoodFlowへようこそ';

  @override
  String get onboardingWelcomeSubtitle => 'お気に入りのグルメを注文、素早くお届け';

  @override
  String get onboardingLocationTitle => '近くのレストランを探す';

  @override
  String get onboardingLocationSubtitle => '位置情報を許可して近くの最高のレストランを見つけましょう';

  @override
  String get onboardingNotificationTitle => 'リアルタイム注文更新';

  @override
  String get onboardingNotificationSubtitle => '注文確認・配達中にプッシュ通知でお知らせ';

  @override
  String get loyaltyTitle => 'ポイント';

  @override
  String get loyaltyPointsBalance => '現在のポイント';

  @override
  String loyaltyPoints(int count) {
    return '${count}pt';
  }

  @override
  String get loyaltyTierBronze => 'ブロンズ';

  @override
  String get loyaltyTierSilver => 'シルバー';

  @override
  String get loyaltyTierGold => 'ゴールド';

  @override
  String get loyaltyTierPlatinum => 'プラチナ';

  @override
  String get loyaltyNextTier => '次のティア';

  @override
  String loyaltyPointsToNextTier(int points) {
    return 'ランクアップまであと${points}pt';
  }

  @override
  String get loyaltyHistory => 'ポイント履歴';

  @override
  String get loyaltyHistoryEmpty => 'ポイント履歴がありません';

  @override
  String get loyaltyRedeem => 'ポイント交換';

  @override
  String get walletTitle => 'ウォレット';

  @override
  String get walletBalance => '残高';

  @override
  String get walletTopUp => 'チャージ';

  @override
  String get walletWithdraw => '出金';

  @override
  String get walletTransactionHistory => '取引履歴';

  @override
  String get walletTransactionEmpty => '取引履歴がありません';

  @override
  String get walletTopUpTitle => 'ウォレットチャージ';

  @override
  String get walletSelectAmount => '金額を選択';

  @override
  String get walletConfirmTopUp => 'チャージを確認';

  @override
  String get walletDebit => '支出';

  @override
  String get walletCredit => 'チャージ';

  @override
  String get walletReasonOrderPayment => '注文の支払い';

  @override
  String get walletReasonOrderRefund => '注文の返金';

  @override
  String get walletReasonWithdrawal => '出金';

  @override
  String get walletReasonAdjustment => '残高調整';

  @override
  String get referralTitle => '友達を招待';

  @override
  String get referralSubtitle => '招待コードを共有して特典をゲット';

  @override
  String get referralCode => 'あなたの招待コード';

  @override
  String get referralCopyCode => 'コードをコピー';

  @override
  String get referralCodeCopied => 'コードをコピーしました！';

  @override
  String get referralShareCode => 'コードを共有';

  @override
  String get referralShareSheetTitle => '紹介コードを共有';

  @override
  String referralShareMessage(String code) {
    return 'FoodFlowの初回注文で特典を受け取るにはコード $code を使ってください！';
  }

  @override
  String referralInviteCount(int count) {
    return '$count人を招待済み';
  }

  @override
  String get referralBonusEarned => '獲得済みボーナス';

  @override
  String get referralHowItWorks => '仕組み';

  @override
  String get referralStep1 => '招待コードを友達に共有';

  @override
  String get referralStep2 => '友達が登録して初回注文';

  @override
  String get referralStep3 => '対象の特典は確認後に表示されます';

  @override
  String get helpTitle => 'ヘルプセンター';

  @override
  String get helpSearchHint => '質問を検索...';

  @override
  String get helpFaq => 'よくある質問';

  @override
  String get helpFaqEmpty => '質問が見つかりません';

  @override
  String get helpChatSupport => 'チャットサポート';

  @override
  String get helpCallSupport => '電話サポート';

  @override
  String get helpEmailSupport => 'メールサポート';

  @override
  String get helpCategories => 'カテゴリ';

  @override
  String get helpCategoryOrders => '注文';

  @override
  String get helpCategoryPayment => '支払い';

  @override
  String get helpCategoryDelivery => '配送';

  @override
  String get helpCategoryAccount => 'アカウント';

  @override
  String get filterTitle => 'フィルター';

  @override
  String get filterApply => '適用';

  @override
  String get filterReset => 'リセット';

  @override
  String get filterRating => '評価';

  @override
  String get filterDeliveryTime => '配達時間';

  @override
  String get filterPriceRange => '価格帯';

  @override
  String filterMinutes(int min) {
    return '$min分';
  }

  @override
  String get filterFreeDelivery => '送料無料';

  @override
  String get filterOpenNow => '営業中';

  @override
  String get addressPickerTitle => '住所を選択';

  @override
  String get addressPickerSearchHint => '住所を検索...';

  @override
  String get addressPickerUseCurrentLocation => '現在地を使用';

  @override
  String get addressPickerSaved => '保存済み住所';

  @override
  String get addressPickerNoSaved => '保存済み住所なし';

  @override
  String get addressPickerConfirm => 'この住所を確認';

  @override
  String get driver_onboarding_vehicle_title => '車両情報';

  @override
  String get driver_onboarding_vehicle_subtitle => 'あなたの車両について教えてください';

  @override
  String get driver_onboarding_vehicle_type_label => '車両タイプ';

  @override
  String get driver_onboarding_vehicle_type_bike => '自転車';

  @override
  String get driver_onboarding_vehicle_type_motorbike => 'バイク';

  @override
  String get driver_onboarding_vehicle_type_car => '自動車';

  @override
  String get driver_onboarding_plate_label => 'ナンバープレート';

  @override
  String get driver_onboarding_plate_hint => 'ナンバープレートを入力';

  @override
  String get driver_onboarding_plate_required => 'ナンバープレートを入力してください';

  @override
  String get driver_onboarding_next => '次へ';

  @override
  String get driver_onboarding_documents_title => '必要書類';

  @override
  String get driver_onboarding_documents_subtitle => '審査に必要な書類をすべてアップロードしてください';

  @override
  String get driver_onboarding_agreement_title => 'ドライバー規約';

  @override
  String get driver_onboarding_agreement_subtitle => '規約を読んで同意してから参加してください';

  @override
  String get driver_onboarding_agreement_read => '利用規約を読んで同意します';

  @override
  String get driver_onboarding_agreement_accept => '同意して続ける';

  @override
  String get driver_onboarding_agreement_submit => '申請を送信';

  @override
  String get driver_onboarding_agreement_note =>
      '申請は24〜48時間以内に審査されます。承認されたら通知が届きます。';

  @override
  String get driver_onboarding_agreement_terms =>
      '1. FoodFlow 配達パートナーサービス\n\nFoodFlow の配達パートナーとして登録することで、承認された稼働エリアで配達サービスを提供することに同意します。\n\n2. 要件\n\n• 有効な運転免許証と必要な車両書類を維持すること。\n• 登録プロフィールに一致する安全で保険加入済みの車両を使用すること。\n• プロとしての対応、適切な評価、交通法規の遵守を維持すること。\n• 顧客、店舗、注文情報を機密として扱うこと。\n\n3. 報酬と精算\n\n報酬は完了した注文、距離、インセンティブ、承認済み調整に基づいて計算されます。週次精算は FoodFlow に保存された銀行口座へ支払われます。\n\n4. 行動基準\n\n配達パートナーは顧客、店舗、サポート担当者に対して礼儀正しく行動する必要があります。不正、乱用、危険な配達、虚偽報告はアカウント停止または終了の対象になります。\n\n5. 終了\n\nFoodFlow は、本規約、安全規則、法的要件に違反した場合、アクセスを一時停止または終了できます。';

  @override
  String get driver_onboarding_agreement_failed =>
      '規約への同意を保存できませんでした。もう一度お試しください。';

  @override
  String get driver_incentives_title => 'インセンティブ';

  @override
  String get driver_incentives_active => '進行中';

  @override
  String get driver_incentives_completed => '完了';

  @override
  String driver_incentives_progress(int current, int target) {
    return '$current/$target件';
  }

  @override
  String driver_incentives_reward(String amount) {
    return '報酬: $amount';
  }

  @override
  String get driver_incentives_empty => 'インセンティブはありません';

  @override
  String get driver_incentives_error => 'インセンティブを読み込めません';

  @override
  String get driver_incentives_retry => '再試行';

  @override
  String driver_incentives_expires(String date) {
    return '有効期限: $date';
  }

  @override
  String get driver_heatmap_title => '需要マップ';

  @override
  String get driver_heatmap_subtitle => '現在配達需要が高いエリア';

  @override
  String get driver_heatmap_high => '需要高';

  @override
  String get driver_heatmap_medium => '需要中';

  @override
  String get driver_heatmap_low => '需要低';

  @override
  String get driver_heatmap_legend => 'カラー凡例';

  @override
  String get driver_heatmap_window_now => '現在';

  @override
  String get driver_heatmap_window_next_hour => '次の1時間';

  @override
  String get driver_heatmap_window_next_three_hours => '次の3時間';

  @override
  String get driver_heatmap_window_today => '今日';

  @override
  String get driver_heatmap_missing_location_title => 'ドライバーの位置情報がありません';

  @override
  String get driver_heatmap_missing_location_description =>
      '実際の現在地周辺の需要を読み込むには、オンラインにするかGPSの更新を待ってください。';

  @override
  String get driver_heatmap_empty_title => '需要データはまだありません';

  @override
  String get driver_heatmap_empty_description => '現在のエリアに注文があると需要データが表示されます。';

  @override
  String driver_heatmap_order_count(int count) {
    return '$count件の注文';
  }

  @override
  String driver_heatmap_avg_payout(String amount) {
    return '平均 $amountđ/件';
  }

  @override
  String get driver_bank_title => '銀行口座';

  @override
  String get driver_bank_subtitle => '毎週の報酬受取用口座を追加';

  @override
  String get driver_bank_name_label => '銀行名';

  @override
  String get driver_bank_name_hint => '銀行を選択';

  @override
  String get driver_bank_account_label => '口座番号';

  @override
  String get driver_bank_account_hint => '口座番号を入力';

  @override
  String get driver_bank_account_required => '口座番号を入力してください';

  @override
  String get driver_bank_save => '口座を保存';

  @override
  String get driver_bank_saved => '銀行口座を保存しました';

  @override
  String get driver_bank_verify => '口座を確認';

  @override
  String get driver_bank_add_title => '銀行口座を追加';

  @override
  String get driver_bank_name_required => '銀行を選択してください';

  @override
  String get driver_bank_holder_label => '口座名義';

  @override
  String get driver_bank_holder_hint => 'NGUYEN VAN A';

  @override
  String get driver_bank_holder_required => '口座名義を入力してください';

  @override
  String get driver_bank_linked_title => '連携済み口座';

  @override
  String get driver_bank_default_badge => '既定';

  @override
  String get driver_bank_add_button => '銀行口座を追加';

  @override
  String get driver_bank_save_failed => '銀行口座を更新できませんでした。もう一度お試しください。';

  @override
  String get driver_bank_delete_tooltip => '銀行口座を削除';

  @override
  String get driver_bank_delete_title => '銀行口座を削除しますか？';

  @override
  String get driver_bank_delete_message => 'この受取口座は配達員プロフィールから削除されます。';

  @override
  String get driver_bank_delete_confirm => '削除';

  @override
  String get driver_bank_cancel => 'キャンセル';

  @override
  String get driver_bank_retry => '再試行';

  @override
  String get driver_tip_title => 'チップ調整';

  @override
  String get driver_tip_header_title => 'お客様から現金チップを受け取りましたか？';

  @override
  String get driver_tip_order_prefix => '注文元';

  @override
  String get driver_tip_customer_prefix => '顧客';

  @override
  String get driver_tip_picker_title => 'チップ金額を選択';

  @override
  String get driver_tip_custom_title => 'または別の金額を入力';

  @override
  String get driver_tip_custom_hint => '金額を入力（VND）';

  @override
  String get driver_tip_skip => 'スキップ';

  @override
  String get driver_tip_confirm => '確認';

  @override
  String get driver_tip_success_snackbar => 'チップ報告を保存しました';

  @override
  String get driver_tip_success_message => 'チップ報告は照合用に保存されました。支払い精算は自動変更されません。';

  @override
  String get driver_notifications_read_all => 'すべて既読';

  @override
  String get driver_notifications_all => 'すべて';

  @override
  String get driver_notifications_orders => '注文';

  @override
  String get driver_notifications_rewards => '報酬';

  @override
  String get driver_notifications_system => 'システム';

  @override
  String get driver_notifications_empty_title => '通知はありません';

  @override
  String get driver_notifications_empty_subtitle => 'ドライバー通知はまだありません。';

  @override
  String get driver_notifications_load_failed => '通知を読み込めませんでした';

  @override
  String get driver_notifications_now => 'たった今';

  @override
  String get driver_notifications_minute_suffix => '分';

  @override
  String get driver_notifications_hour_suffix => '時間';

  @override
  String get driver_notifications_day_suffix => '日';

  @override
  String get driver_support_title => 'ドライバーサポート';

  @override
  String get driver_support_subtitle => 'いつでもお手伝いします';

  @override
  String get driver_support_faq => 'よくある質問';

  @override
  String get driver_support_contact => 'サポートに連絡';

  @override
  String get driver_support_chat => 'ライブチャット';

  @override
  String get driver_support_email => 'メールを送る';

  @override
  String get driver_support_phone => 'ホットライン: 1800-xxxx';

  @override
  String get driver_support_faq_q1 => 'いつ支払われますか？';

  @override
  String get driver_support_faq_a1 => '毎週月曜日に銀行口座へ振り込まれます。';

  @override
  String get driver_support_faq_q2 => '配達エリアを変更するには？';

  @override
  String get driver_support_faq_a2 => '設定 > 活動エリアから変更できます。';

  @override
  String get driver_settings_title => '設定';

  @override
  String get driver_settings_notifications => 'プッシュ通知';

  @override
  String get driver_settings_notifications_subtitle => '新しい注文の通知を受け取る';

  @override
  String get driver_settings_language => '言語';

  @override
  String get driver_settings_language_subtitle => '日本語';

  @override
  String get driver_settings_privacy => 'プライバシーポリシー';

  @override
  String get driver_settings_about => 'アプリについて';

  @override
  String get driver_settings_logout => 'ログアウト';

  @override
  String get driver_settings_logout_confirm => 'ログアウトしますか？';

  @override
  String get driver_settings_sound => '通知音';

  @override
  String get driver_settings_sound_subtitle => '新しい注文が届いたときに音を鳴らす';

  @override
  String driver_settings_version(String version) {
    return 'バージョン $version';
  }

  @override
  String get favoritesTitle => 'お気に入り';

  @override
  String get favoritesEmpty => 'お気に入りのレストランはまだありません';

  @override
  String get favoritesEmptySubtitle => 'レストランを探してお気に入りに追加しましょう';

  @override
  String get favoritesEmptyCta => 'レストランを探す';

  @override
  String get searchInputHint => '料理、レストランを検索...';

  @override
  String get searchButtonLabel => '検索';

  @override
  String get searchRecentLabel => '最近の検索';

  @override
  String get searchClearAll => 'すべて削除';

  @override
  String get searchEmptyTitle => '料理・レストランを検索';

  @override
  String get searchEmptySubtitle => '探したい料理名やレストラン名を入力してください';

  @override
  String searchNoResults(String query) {
    return '「$query」の検索結果はありません';
  }

  @override
  String get searchNoResultsSubtitle => '別のキーワードを試すかフィルターを変更してください';

  @override
  String get searchClosedBadge => '閉店中';

  @override
  String get searchFilterNearest => '最も近い';

  @override
  String get searchFilterTopRated => '評価が高い';

  @override
  String get searchFilterPriceLowHigh => '価格が安い順';

  @override
  String get searchFilterOpenNow => '営業中';

  @override
  String get searchLoadFailed => '現在検索できません。もう一度お試しください。';

  @override
  String get vouchersTitle => 'オファー＆バウチャー';

  @override
  String get vouchersTabMine => 'マイバウチャー';

  @override
  String get vouchersTabAvailable => '利用可能';

  @override
  String get vouchersTabExpired => '期限切れ';

  @override
  String get vouchersCodeCopied => 'コードをコピーしました';

  @override
  String get vouchersEmptyMine => 'バウチャーはまだありません';

  @override
  String get vouchersEmptyAvailable => '利用可能なバウチャーはありません';

  @override
  String get vouchersEmptyAvailableSubtitle => '利用可能なバウチャーを探す';

  @override
  String get vouchersEmptyExpired => '期限切れのバウチャーはありません';

  @override
  String get vouchersEmptyExpiredSubtitle => '期限切れのバウチャーはここに表示されます';

  @override
  String get vouchersUseNow => '今すぐ使う';

  @override
  String vouchersPercentOff(int percent) {
    return '$percent%オフ';
  }

  @override
  String vouchersMinOrder(String amount) {
    return '最低注文額 $amount';
  }

  @override
  String vouchersExpiresAt(String date) {
    return '有効期限: $date';
  }

  @override
  String get cancelOrderTitle => '注文をキャンセル';

  @override
  String get cancelOrderSuccess => '注文をキャンセルしました';

  @override
  String get cancelOrderFailed => '注文をキャンセルできません';

  @override
  String get cancelOrderInfoHeader => '注文情報';

  @override
  String get cancelOrderReasonHeader => 'キャンセル理由を選択';

  @override
  String get cancelOrderReasonSubtitle => 'ご不便をおかけして申し訳ございません';

  @override
  String get cancelOrderReasonSlow => 'レストランの対応が遅い';

  @override
  String get cancelOrderReasonChanged => '気が変わった';

  @override
  String get cancelOrderReasonWrong => '間違えて注文した';

  @override
  String get cancelOrderReasonOther => 'その他';

  @override
  String get cancelOrderNoteHint => '追加メモ（任意）';

  @override
  String get cancelOrderRefundNote => '3〜5営業日以内に返金されます';

  @override
  String get cancelOrderConfirmCta => 'キャンセルを確認';

  @override
  String get helpCenterSearchHint => '質問を検索...';

  @override
  String get helpCenterChatCta => 'サポートとチャット';

  @override
  String get helpCenterNoResults => '一致する質問が見つかりません';

  @override
  String get helpFaqCancelOrderQ => '注文をキャンセルするには？';

  @override
  String get helpFaqCancelOrderA =>
      '注文後2分以内であればキャンセルできます。「注文」→注文を選択→「キャンセル」をタップしてください。';

  @override
  String get helpFaqLateDeliveryQ => '注文が遅れている場合はどうすれば？';

  @override
  String get helpFaqLateDeliveryA => 'チャットサポートにご連絡いただければ、ドライバーに直接確認いたします。';

  @override
  String get helpFaqPaymentMethodsQ => '利用可能な支払い方法は？';

  @override
  String get helpFaqPaymentMethodsA => '現在、代金引換とFoodFlow電子ウォレットに対応しています。';

  @override
  String get helpFaqTopUpWalletQ => 'ウォレットにチャージするには？';

  @override
  String get helpFaqTopUpWalletA =>
      '「プロフィール」→「ウォレット」→「チャージ」をタップし、希望金額を選択してください。';

  @override
  String get helpFaqAddAddressQ => '配送先住所を追加するには？';

  @override
  String get helpFaqAddAddressA => '「プロフィール」→「住所」→「住所を追加」をタップし、情報を入力してください。';

  @override
  String get helpFaqMissingOrderQ => '注文を受け取っていない場合は？';

  @override
  String get helpFaqMissingOrderA =>
      'ドライバーが配達完了とマークしたのに受け取っていない場合は、すぐにサポートにご連絡ください。';

  @override
  String get helpFaqRewardPointsQ => 'ポイントはどのように貯まりますか？';

  @override
  String get helpFaqRewardPointsA =>
      'ポイント残高は確認済みのロイヤルティ台帳から計算されます。獲得特典や紹介特典はFoodFlowで記録された後に表示されます。';

  @override
  String get helpFaqTrackOrderQ => '注文をリアルタイムで追跡するには？';

  @override
  String get helpFaqTrackOrderA => '注文後、「注文」→アクティブな注文を選択→「追跡」をタップしてください。';
}
