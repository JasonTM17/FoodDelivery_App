import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ja'),
    Locale('vi'),
  ];

  /// No description provided for @loginTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get loginTitle;

  /// No description provided for @loginWelcomeBack.
  ///
  /// In vi, this message translates to:
  /// **'Chào mừng bạn quay trở lại'**
  String get loginWelcomeBack;

  /// No description provided for @emailLabel.
  ///
  /// In vi, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @emailHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email của bạn'**
  String get emailHint;

  /// No description provided for @emailRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập email'**
  String get emailRequired;

  /// No description provided for @emailInvalid.
  ///
  /// In vi, this message translates to:
  /// **'Email không hợp lệ'**
  String get emailInvalid;

  /// No description provided for @passwordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu'**
  String get passwordLabel;

  /// No description provided for @passwordHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mật khẩu'**
  String get passwordHint;

  /// No description provided for @passwordRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập mật khẩu'**
  String get passwordRequired;

  /// No description provided for @passwordMinLength.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu phải có ít nhất 6 ký tự'**
  String get passwordMinLength;

  /// No description provided for @forgotPassword.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu?'**
  String get forgotPassword;

  /// No description provided for @forgotPasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu'**
  String get forgotPasswordTitle;

  /// No description provided for @forgotPasswordContent.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng liên hệ hỗ trợ qua email để được cấp lại mật khẩu.'**
  String get forgotPasswordContent;

  /// No description provided for @close.
  ///
  /// In vi, this message translates to:
  /// **'Đóng'**
  String get close;

  /// No description provided for @loginButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get loginButton;

  /// No description provided for @noAccount.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tài khoản?'**
  String get noAccount;

  /// No description provided for @registerLink.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get registerLink;

  /// No description provided for @registerAsDriver.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký làm tài xế'**
  String get registerAsDriver;

  /// No description provided for @registerTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get registerTitle;

  /// No description provided for @registerCreateAccount.
  ///
  /// In vi, this message translates to:
  /// **'Tạo tài khoản mới'**
  String get registerCreateAccount;

  /// No description provided for @registerSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Điền thông tin để bắt đầu sử dụng FoodFlow'**
  String get registerSubtitle;

  /// No description provided for @fullNameLabel.
  ///
  /// In vi, this message translates to:
  /// **'Họ và tên'**
  String get fullNameLabel;

  /// No description provided for @fullNameHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập họ và tên'**
  String get fullNameHint;

  /// No description provided for @fullNameRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập họ và tên'**
  String get fullNameRequired;

  /// No description provided for @fullNameMinLength.
  ///
  /// In vi, this message translates to:
  /// **'Họ tên phải có ít nhất 2 ký tự'**
  String get fullNameMinLength;

  /// No description provided for @phoneLabel.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại'**
  String get phoneLabel;

  /// No description provided for @phoneHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập số điện thoại'**
  String get phoneHint;

  /// No description provided for @phoneRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập số điện thoại'**
  String get phoneRequired;

  /// No description provided for @phoneInvalid.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại không hợp lệ'**
  String get phoneInvalid;

  /// No description provided for @passwordHintLong.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mật khẩu (ít nhất 6 ký tự)'**
  String get passwordHintLong;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu'**
  String get confirmPasswordLabel;

  /// No description provided for @confirmPasswordHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập lại mật khẩu'**
  String get confirmPasswordHint;

  /// No description provided for @confirmPasswordRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng xác nhận mật khẩu'**
  String get confirmPasswordRequired;

  /// No description provided for @passwordMismatch.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu không khớp'**
  String get passwordMismatch;

  /// No description provided for @registerAs.
  ///
  /// In vi, this message translates to:
  /// **'Bạn muốn đăng ký với tư cách?'**
  String get registerAs;

  /// No description provided for @roleCustomer.
  ///
  /// In vi, this message translates to:
  /// **'Khách hàng'**
  String get roleCustomer;

  /// No description provided for @roleDriver.
  ///
  /// In vi, this message translates to:
  /// **'Tài xế'**
  String get roleDriver;

  /// No description provided for @registerButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get registerButton;

  /// No description provided for @hasAccount.
  ///
  /// In vi, this message translates to:
  /// **'Đã có tài khoản?'**
  String get hasAccount;

  /// No description provided for @greetingAnonymous.
  ///
  /// In vi, this message translates to:
  /// **'Xin chào!'**
  String get greetingAnonymous;

  /// Greeting with the user's display name
  ///
  /// In vi, this message translates to:
  /// **'Xin chào, {name}!'**
  String greetingNamed(String name);

  /// No description provided for @homeQuestion.
  ///
  /// In vi, this message translates to:
  /// **'Bạn muốn ăn gì hôm nay?'**
  String get homeQuestion;

  /// No description provided for @locating.
  ///
  /// In vi, this message translates to:
  /// **'Đang xác định vị trí...'**
  String get locating;

  /// No description provided for @searchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm món ăn, nhà hàng...'**
  String get searchHint;

  /// No description provided for @nearbyRestaurants.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng gần bạn'**
  String get nearbyRestaurants;

  /// No description provided for @viewAll.
  ///
  /// In vi, this message translates to:
  /// **'Xem tất cả'**
  String get viewAll;

  /// No description provided for @loadingRestaurants.
  ///
  /// In vi, this message translates to:
  /// **'Đang tìm nhà hàng gần bạn...'**
  String get loadingRestaurants;

  /// No description provided for @noRestaurantsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy nhà hàng nào'**
  String get noRestaurantsTitle;

  /// No description provided for @noRestaurantsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Hãy thử mở rộng khu vực tìm kiếm'**
  String get noRestaurantsSubtitle;

  /// No description provided for @reload.
  ///
  /// In vi, this message translates to:
  /// **'Tải lại'**
  String get reload;

  /// No description provided for @navHome.
  ///
  /// In vi, this message translates to:
  /// **'Trang chủ'**
  String get navHome;

  /// No description provided for @navSearch.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm'**
  String get navSearch;

  /// No description provided for @navCart.
  ///
  /// In vi, this message translates to:
  /// **'Giỏ hàng'**
  String get navCart;

  /// No description provided for @navOrders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng'**
  String get navOrders;

  /// No description provided for @navProfile.
  ///
  /// In vi, this message translates to:
  /// **'Cá nhân'**
  String get navProfile;

  /// No description provided for @navEarnings.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập'**
  String get navEarnings;

  /// No description provided for @cuisineAll.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get cuisineAll;

  /// No description provided for @cuisineFastFood.
  ///
  /// In vi, this message translates to:
  /// **'Đồ ăn nhanh'**
  String get cuisineFastFood;

  /// No description provided for @cuisineVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Việt Nam'**
  String get cuisineVietnamese;

  /// No description provided for @cuisineJapanese.
  ///
  /// In vi, this message translates to:
  /// **'Nhật Bản'**
  String get cuisineJapanese;

  /// No description provided for @cuisineKorean.
  ///
  /// In vi, this message translates to:
  /// **'Hàn Quốc'**
  String get cuisineKorean;

  /// No description provided for @cuisineChinese.
  ///
  /// In vi, this message translates to:
  /// **'Trung Hoa'**
  String get cuisineChinese;

  /// No description provided for @cuisineDessert.
  ///
  /// In vi, this message translates to:
  /// **'Tráng miệng'**
  String get cuisineDessert;

  /// No description provided for @cuisineDrinks.
  ///
  /// In vi, this message translates to:
  /// **'Đồ uống'**
  String get cuisineDrinks;

  /// No description provided for @profileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Cá nhân'**
  String get profileTitle;

  /// No description provided for @defaultUser.
  ///
  /// In vi, this message translates to:
  /// **'Người dùng'**
  String get defaultUser;

  /// No description provided for @statsOrders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng'**
  String get statsOrders;

  /// No description provided for @statsReviews.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá'**
  String get statsReviews;

  /// No description provided for @statsAddresses.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ'**
  String get statsAddresses;

  /// No description provided for @statsPoints.
  ///
  /// In vi, this message translates to:
  /// **'Điểm'**
  String get statsPoints;

  /// No description provided for @myAddresses.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ của tôi'**
  String get myAddresses;

  /// No description provided for @myAddressesSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Quản lý địa chỉ giao hàng'**
  String get myAddressesSubtitle;

  /// No description provided for @paymentMethods.
  ///
  /// In vi, this message translates to:
  /// **'Phương thức thanh toán'**
  String get paymentMethods;

  /// No description provided for @paymentMethodsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm hoặc thay đổi phương thức'**
  String get paymentMethodsSubtitle;

  /// No description provided for @notificationsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thông báo'**
  String get notificationsTitle;

  /// No description provided for @notificationsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Quản lý thông báo đẩy'**
  String get notificationsSubtitle;

  /// No description provided for @favorites.
  ///
  /// In vi, this message translates to:
  /// **'Yêu thích'**
  String get favorites;

  /// No description provided for @favoritesSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Danh sách món ăn yêu thích'**
  String get favoritesSubtitle;

  /// No description provided for @support.
  ///
  /// In vi, this message translates to:
  /// **'Hỗ trợ'**
  String get support;

  /// No description provided for @supportSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Trung tâm trợ giúp'**
  String get supportSubtitle;

  /// No description provided for @aboutApp.
  ///
  /// In vi, this message translates to:
  /// **'Về FoodFlow'**
  String get aboutApp;

  /// No description provided for @aboutSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Phiên bản 1.0.0'**
  String get aboutSubtitle;

  /// No description provided for @logout.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get logout;

  /// No description provided for @logoutConfirm.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc muốn đăng xuất?'**
  String get logoutConfirm;

  /// No description provided for @cancel.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get cancel;

  /// No description provided for @featureInDevelopment.
  ///
  /// In vi, this message translates to:
  /// **'Tính năng đang phát triển'**
  String get featureInDevelopment;

  /// No description provided for @driverProfileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ'**
  String get driverProfileTitle;

  /// No description provided for @defaultDriver.
  ///
  /// In vi, this message translates to:
  /// **'Tài xế'**
  String get defaultDriver;

  /// No description provided for @vehicleInfo.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin phương tiện'**
  String get vehicleInfo;

  /// No description provided for @vehicleType.
  ///
  /// In vi, this message translates to:
  /// **'Loại xe'**
  String get vehicleType;

  /// No description provided for @vehiclePlate.
  ///
  /// In vi, this message translates to:
  /// **'Biển số'**
  String get vehiclePlate;

  /// No description provided for @statistics.
  ///
  /// In vi, this message translates to:
  /// **'Thống kê'**
  String get statistics;

  /// No description provided for @totalDeliveries.
  ///
  /// In vi, this message translates to:
  /// **'Tổng số đơn'**
  String get totalDeliveries;

  /// No description provided for @totalEarnings.
  ///
  /// In vi, this message translates to:
  /// **'Tổng thu nhập'**
  String get totalEarnings;

  /// No description provided for @languageTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ'**
  String get languageTitle;

  /// No description provided for @languageVi.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Việt'**
  String get languageVi;

  /// No description provided for @languageEn.
  ///
  /// In vi, this message translates to:
  /// **'English'**
  String get languageEn;

  /// No description provided for @languageJa.
  ///
  /// In vi, this message translates to:
  /// **'日本語'**
  String get languageJa;

  /// No description provided for @orderStatusPending.
  ///
  /// In vi, this message translates to:
  /// **'Đang chờ'**
  String get orderStatusPending;

  /// No description provided for @orderStatusConfirmed.
  ///
  /// In vi, this message translates to:
  /// **'Đã xác nhận'**
  String get orderStatusConfirmed;

  /// No description provided for @orderStatusPreparing.
  ///
  /// In vi, this message translates to:
  /// **'Đang chuẩn bị'**
  String get orderStatusPreparing;

  /// No description provided for @orderStatusPickedUp.
  ///
  /// In vi, this message translates to:
  /// **'Đang giao'**
  String get orderStatusPickedUp;

  /// No description provided for @orderStatusDelivered.
  ///
  /// In vi, this message translates to:
  /// **'Đã giao'**
  String get orderStatusDelivered;

  /// No description provided for @orderStatusCancelled.
  ///
  /// In vi, this message translates to:
  /// **'Đã hủy'**
  String get orderStatusCancelled;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ja', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ja':
      return AppLocalizationsJa();
    case 'vi':
      return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
