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
  String get paymentMethods => '支払い方法';

  @override
  String get paymentMethodsSubtitle => '支払い方法を追加または変更';

  @override
  String get notificationsTitle => '通知';

  @override
  String get notificationsSubtitle => 'プッシュ通知を管理';

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
  String get featureInDevelopment => 'この機能は近日公開予定です';

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
}
