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

  /// No description provided for @profileLoyalty.
  ///
  /// In vi, this message translates to:
  /// **'Tích điểm thưởng'**
  String get profileLoyalty;

  /// No description provided for @profileLoyaltySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Xem điểm và đổi quà'**
  String get profileLoyaltySubtitle;

  /// No description provided for @profileWallet.
  ///
  /// In vi, this message translates to:
  /// **'Ví của tôi'**
  String get profileWallet;

  /// No description provided for @profileWalletSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Số dư và lịch sử giao dịch'**
  String get profileWalletSubtitle;

  /// No description provided for @profileReferral.
  ///
  /// In vi, this message translates to:
  /// **'Mời bạn bè'**
  String get profileReferral;

  /// No description provided for @profileReferralSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhận thưởng khi giới thiệu'**
  String get profileReferralSubtitle;

  /// No description provided for @profileHelp.
  ///
  /// In vi, this message translates to:
  /// **'Trợ giúp & FAQ'**
  String get profileHelp;

  /// No description provided for @profileHelpSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi thường gặp + liên hệ'**
  String get profileHelpSubtitle;

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

  /// No description provided for @notificationsReadAll.
  ///
  /// In vi, this message translates to:
  /// **'Đọc tất cả'**
  String get notificationsReadAll;

  /// No description provided for @notificationsAll.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get notificationsAll;

  /// No description provided for @notificationsOrders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng'**
  String get notificationsOrders;

  /// No description provided for @notificationsPromotions.
  ///
  /// In vi, this message translates to:
  /// **'Khuyến mãi'**
  String get notificationsPromotions;

  /// No description provided for @notificationsSystem.
  ///
  /// In vi, this message translates to:
  /// **'Hệ thống'**
  String get notificationsSystem;

  /// No description provided for @notificationsEmptyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không có thông báo'**
  String get notificationsEmptyTitle;

  /// No description provided for @notificationsEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Bạn chưa có thông báo nào.'**
  String get notificationsEmptySubtitle;

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

  /// No description provided for @commonRetry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get commonRetry;

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

  /// No description provided for @cartTitle.
  ///
  /// In vi, this message translates to:
  /// **'Giỏ hàng'**
  String get cartTitle;

  /// No description provided for @cartEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Giỏ hàng trống'**
  String get cartEmpty;

  /// No description provided for @cartEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Hãy thêm món ăn vào giỏ hàng'**
  String get cartEmptySubtitle;

  /// No description provided for @cartClearTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa giỏ hàng?'**
  String get cartClearTitle;

  /// No description provided for @cartClearContent.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc muốn xóa tất cả món trong giỏ hàng?'**
  String get cartClearContent;

  /// No description provided for @cartKeep.
  ///
  /// In vi, this message translates to:
  /// **'Giữ lại'**
  String get cartKeep;

  /// No description provided for @cartClearAll.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tất cả'**
  String get cartClearAll;

  /// No description provided for @cartPromoCode.
  ///
  /// In vi, this message translates to:
  /// **'Mã khuyến mãi'**
  String get cartPromoCode;

  /// No description provided for @cartPromoHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mã giảm giá'**
  String get cartPromoHint;

  /// No description provided for @cartPromoRemove.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ'**
  String get cartPromoRemove;

  /// No description provided for @cartPromoApply.
  ///
  /// In vi, this message translates to:
  /// **'Áp dụng'**
  String get cartPromoApply;

  /// Applied promo code message
  ///
  /// In vi, this message translates to:
  /// **'Đã áp dụng mã {code}'**
  String cartPromoApplied(String code);

  /// No description provided for @cartSubtotal.
  ///
  /// In vi, this message translates to:
  /// **'Tạm tính'**
  String get cartSubtotal;

  /// No description provided for @cartDeliveryFee.
  ///
  /// In vi, this message translates to:
  /// **'Phí giao hàng'**
  String get cartDeliveryFee;

  /// No description provided for @cartDeliveryFeeLoading.
  ///
  /// In vi, this message translates to:
  /// **'Đang lấy từ máy chủ…'**
  String get cartDeliveryFeeLoading;

  /// No description provided for @cartDeliveryFeeUnavailable.
  ///
  /// In vi, this message translates to:
  /// **'Chưa xác định'**
  String get cartDeliveryFeeUnavailable;

  /// No description provided for @cartFreeDelivery.
  ///
  /// In vi, this message translates to:
  /// **'Miễn phí'**
  String get cartFreeDelivery;

  /// No description provided for @cartDiscountLabel.
  ///
  /// In vi, this message translates to:
  /// **'Giảm giá'**
  String get cartDiscountLabel;

  /// No description provided for @cartGrandTotal.
  ///
  /// In vi, this message translates to:
  /// **'Tổng cộng'**
  String get cartGrandTotal;

  /// No description provided for @cartViewCart.
  ///
  /// In vi, this message translates to:
  /// **'Xem giỏ hàng'**
  String get cartViewCart;

  /// No description provided for @cartDelete.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get cartDelete;

  /// No description provided for @checkoutTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thanh toán'**
  String get checkoutTitle;

  /// No description provided for @checkoutDeliveryAddress.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ giao hàng'**
  String get checkoutDeliveryAddress;

  /// No description provided for @checkoutNoAddress.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có địa chỉ nào'**
  String get checkoutNoAddress;

  /// No description provided for @checkoutNoAddressSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa chỉ để tiếp tục đặt hàng'**
  String get checkoutNoAddressSubtitle;

  /// No description provided for @checkoutAddAddress.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa chỉ mới'**
  String get checkoutAddAddress;

  /// No description provided for @checkoutPaymentMethod.
  ///
  /// In vi, this message translates to:
  /// **'Phương thức thanh toán'**
  String get checkoutPaymentMethod;

  /// No description provided for @checkoutPaymentCash.
  ///
  /// In vi, this message translates to:
  /// **'Tiền mặt'**
  String get checkoutPaymentCash;

  /// No description provided for @checkoutPaymentCashSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thanh toán khi nhận hàng'**
  String get checkoutPaymentCashSubtitle;

  /// No description provided for @checkoutPaymentWallet.
  ///
  /// In vi, this message translates to:
  /// **'Ví điện tử'**
  String get checkoutPaymentWallet;

  /// No description provided for @checkoutNoteForDriver.
  ///
  /// In vi, this message translates to:
  /// **'Ghi chú cho tài xế'**
  String get checkoutNoteForDriver;

  /// No description provided for @checkoutNoteHint.
  ///
  /// In vi, this message translates to:
  /// **'Thêm ghi chú...'**
  String get checkoutNoteHint;

  /// No description provided for @checkoutOrderSummary.
  ///
  /// In vi, this message translates to:
  /// **'Tóm tắt đơn hàng'**
  String get checkoutOrderSummary;

  /// No description provided for @checkoutSelectAddress.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn địa chỉ giao hàng'**
  String get checkoutSelectAddress;

  /// No description provided for @checkoutOrderFailed.
  ///
  /// In vi, this message translates to:
  /// **'Đặt hàng thất bại'**
  String get checkoutOrderFailed;

  /// No description provided for @addressDefault.
  ///
  /// In vi, this message translates to:
  /// **'Mặc định'**
  String get addressDefault;

  /// No description provided for @restaurantListTitle.
  ///
  /// In vi, this message translates to:
  /// **'Quanh đây'**
  String get restaurantListTitle;

  /// No description provided for @restaurantViewList.
  ///
  /// In vi, this message translates to:
  /// **'Danh sách'**
  String get restaurantViewList;

  /// No description provided for @restaurantViewMap.
  ///
  /// In vi, this message translates to:
  /// **'Bản đồ'**
  String get restaurantViewMap;

  /// No description provided for @restaurantNoResults.
  ///
  /// In vi, this message translates to:
  /// **'Không có nhà hàng nào'**
  String get restaurantNoResults;

  /// No description provided for @restaurantNoResultsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thử chọn bộ lọc khác'**
  String get restaurantNoResultsSubtitle;

  /// No description provided for @restaurantMenuTab.
  ///
  /// In vi, this message translates to:
  /// **'Thực đơn'**
  String get restaurantMenuTab;

  /// No description provided for @restaurantReviewsTab.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá'**
  String get restaurantReviewsTab;

  /// No description provided for @restaurantInfoTab.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin'**
  String get restaurantInfoTab;

  /// No description provided for @restaurantMenuEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Thực đơn đang cập nhật'**
  String get restaurantMenuEmpty;

  /// No description provided for @restaurantMenuEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng chưa có món nào trong thực đơn'**
  String get restaurantMenuEmptySubtitle;

  /// No description provided for @restaurantNoReviews.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đánh giá nào'**
  String get restaurantNoReviews;

  /// No description provided for @restaurantInfoTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin nhà hàng'**
  String get restaurantInfoTitle;

  /// No description provided for @restaurantReviewFood.
  ///
  /// In vi, this message translates to:
  /// **'Món ăn'**
  String get restaurantReviewFood;

  /// No description provided for @restaurantReviewDelivery.
  ///
  /// In vi, this message translates to:
  /// **'Giao hàng'**
  String get restaurantReviewDelivery;

  /// No description provided for @restaurantReviewCountLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá'**
  String get restaurantReviewCountLabel;

  /// No description provided for @foodPopular.
  ///
  /// In vi, this message translates to:
  /// **'Phổ biến'**
  String get foodPopular;

  /// No description provided for @foodSpecialNote.
  ///
  /// In vi, this message translates to:
  /// **'Ghi chú đặc biệt'**
  String get foodSpecialNote;

  /// No description provided for @foodNoteHint.
  ///
  /// In vi, this message translates to:
  /// **'Ví dụ: Không hành, ít cay...'**
  String get foodNoteHint;

  /// No description provided for @foodRequired.
  ///
  /// In vi, this message translates to:
  /// **'(Bắt buộc)'**
  String get foodRequired;

  /// No description provided for @foodAddToCart.
  ///
  /// In vi, this message translates to:
  /// **'Thêm vào giỏ'**
  String get foodAddToCart;

  /// No description provided for @trackingOrderStatus.
  ///
  /// In vi, this message translates to:
  /// **'Trạng thái đơn hàng'**
  String get trackingOrderStatus;

  /// No description provided for @trackingStepPending.
  ///
  /// In vi, this message translates to:
  /// **'Chờ xác nhận'**
  String get trackingStepPending;

  /// No description provided for @trackingStepPreparing.
  ///
  /// In vi, this message translates to:
  /// **'Đang chuẩn bị'**
  String get trackingStepPreparing;

  /// No description provided for @trackingStepDelivering.
  ///
  /// In vi, this message translates to:
  /// **'Đang giao'**
  String get trackingStepDelivering;

  /// No description provided for @trackingStepDelivered.
  ///
  /// In vi, this message translates to:
  /// **'Đã giao'**
  String get trackingStepDelivered;

  /// No description provided for @trackingOrderInProgress.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng đang được giao'**
  String get trackingOrderInProgress;

  /// No description provided for @trackingCallDriver.
  ///
  /// In vi, this message translates to:
  /// **'Gọi'**
  String get trackingCallDriver;

  /// No description provided for @trackingMessageDriver.
  ///
  /// In vi, this message translates to:
  /// **'Nhắn tin'**
  String get trackingMessageDriver;

  /// No description provided for @trackingMarkerRestaurant.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng'**
  String get trackingMarkerRestaurant;

  /// No description provided for @trackingMarkerDriver.
  ///
  /// In vi, this message translates to:
  /// **'Tài xế'**
  String get trackingMarkerDriver;

  /// No description provided for @trackingMarkerDestination.
  ///
  /// In vi, this message translates to:
  /// **'Điểm đến'**
  String get trackingMarkerDestination;

  /// No description provided for @orderHistoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng của tôi'**
  String get orderHistoryTitle;

  /// No description provided for @orderHistoryTabActive.
  ///
  /// In vi, this message translates to:
  /// **'Đang hoạt động ({count})'**
  String orderHistoryTabActive(int count);

  /// No description provided for @orderHistoryTabCompleted.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành ({count})'**
  String orderHistoryTabCompleted(int count);

  /// No description provided for @orderHistoryTabCancelled.
  ///
  /// In vi, this message translates to:
  /// **'Đã hủy ({count})'**
  String orderHistoryTabCancelled(int count);

  /// No description provided for @orderHistoryNoActive.
  ///
  /// In vi, this message translates to:
  /// **'Không có đơn hàng đang hoạt động'**
  String get orderHistoryNoActive;

  /// No description provided for @orderHistoryNoCompleted.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đơn hàng hoàn thành'**
  String get orderHistoryNoCompleted;

  /// No description provided for @orderHistoryNoCancelled.
  ///
  /// In vi, this message translates to:
  /// **'Không có đơn hàng đã hủy'**
  String get orderHistoryNoCancelled;

  /// No description provided for @orderHistoryEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Các đơn hàng sẽ xuất hiện ở đây'**
  String get orderHistoryEmptySubtitle;

  /// No description provided for @orderHistoryTrack.
  ///
  /// In vi, this message translates to:
  /// **'Theo dõi'**
  String get orderHistoryTrack;

  /// No description provided for @addressManagementTitle.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ của tôi'**
  String get addressManagementTitle;

  /// No description provided for @addressAdd.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa chỉ'**
  String get addressAdd;

  /// No description provided for @addressLoading.
  ///
  /// In vi, this message translates to:
  /// **'Đang tải địa chỉ...'**
  String get addressLoading;

  /// No description provided for @addressEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có địa chỉ nào'**
  String get addressEmpty;

  /// No description provided for @addressEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa chỉ để bắt đầu đặt hàng'**
  String get addressEmptySubtitle;

  /// No description provided for @addressSetDefault.
  ///
  /// In vi, this message translates to:
  /// **'Đặt làm mặc định'**
  String get addressSetDefault;

  /// No description provided for @addressEdit.
  ///
  /// In vi, this message translates to:
  /// **'Sửa'**
  String get addressEdit;

  /// No description provided for @addressDeleteTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xóa địa chỉ?'**
  String get addressDeleteTitle;

  /// No description provided for @addressDeleteContent.
  ///
  /// In vi, this message translates to:
  /// **'Xóa \"{label}\"?'**
  String addressDeleteContent(String label);

  /// No description provided for @addressAddSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đã thêm địa chỉ mới'**
  String get addressAddSuccess;

  /// No description provided for @addressUpdateSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đã cập nhật địa chỉ'**
  String get addressUpdateSuccess;

  /// No description provided for @addressDeleteSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đã xóa địa chỉ'**
  String get addressDeleteSuccess;

  /// No description provided for @addressSave.
  ///
  /// In vi, this message translates to:
  /// **'Lưu'**
  String get addressSave;

  /// No description provided for @addressLabelField.
  ///
  /// In vi, this message translates to:
  /// **'Nhãn'**
  String get addressLabelField;

  /// No description provided for @addressFieldLabel.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ'**
  String get addressFieldLabel;

  /// No description provided for @addressFieldHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập địa chỉ chi tiết'**
  String get addressFieldHint;

  /// No description provided for @addressRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập địa chỉ'**
  String get addressRequired;

  /// No description provided for @addressAddDialogTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa chỉ mới'**
  String get addressAddDialogTitle;

  /// No description provided for @addressEditDialogTitle.
  ///
  /// In vi, this message translates to:
  /// **'Sửa địa chỉ'**
  String get addressEditDialogTitle;

  /// No description provided for @addressAddFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể thêm địa chỉ'**
  String get addressAddFailed;

  /// No description provided for @addressLocationRequired.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn vị trí hợp lệ trên bản đồ.'**
  String get addressLocationRequired;

  /// No description provided for @addressLocationInvalid.
  ///
  /// In vi, this message translates to:
  /// **'Vị trí địa chỉ không hợp lệ. Hãy chọn lại trên bản đồ.'**
  String get addressLocationInvalid;

  /// No description provided for @addressUpdateFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể cập nhật địa chỉ'**
  String get addressUpdateFailed;

  /// No description provided for @addressDeleteFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể xóa địa chỉ'**
  String get addressDeleteFailed;

  /// No description provided for @addressDeleteAction.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get addressDeleteAction;

  /// No description provided for @addressHomeLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nhà'**
  String get addressHomeLabel;

  /// No description provided for @addressWorkLabel.
  ///
  /// In vi, this message translates to:
  /// **'Công ty'**
  String get addressWorkLabel;

  /// No description provided for @addressOtherLabel.
  ///
  /// In vi, this message translates to:
  /// **'Khác'**
  String get addressOtherLabel;

  /// No description provided for @supportConnecting.
  ///
  /// In vi, this message translates to:
  /// **'Đang kết nối...'**
  String get supportConnecting;

  /// No description provided for @supportDriverOnline.
  ///
  /// In vi, this message translates to:
  /// **'Đang hoạt động'**
  String get supportDriverOnline;

  /// No description provided for @supportAiHeader.
  ///
  /// In vi, this message translates to:
  /// **'Hỗ trợ bởi AI - Trả lời nhanh các câu hỏi thường gặp'**
  String get supportAiHeader;

  /// No description provided for @supportNoMessages.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tin nhắn nào'**
  String get supportNoMessages;

  /// No description provided for @supportNoMessagesSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Gửi tin nhắn đầu tiên để bắt đầu trò chuyện'**
  String get supportNoMessagesSubtitle;

  /// No description provided for @supportMessageHint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập tin nhắn...'**
  String get supportMessageHint;

  /// No description provided for @reviewTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá đơn hàng'**
  String get reviewTitle;

  /// No description provided for @reviewFoodQuality.
  ///
  /// In vi, this message translates to:
  /// **'Chất lượng món ăn'**
  String get reviewFoodQuality;

  /// No description provided for @reviewDeliveryQuality.
  ///
  /// In vi, this message translates to:
  /// **'Chất lượng giao hàng'**
  String get reviewDeliveryQuality;

  /// No description provided for @reviewComment.
  ///
  /// In vi, this message translates to:
  /// **'Nhận xét của bạn'**
  String get reviewComment;

  /// No description provided for @reviewCommentHint.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ trải nghiệm của bạn về món ăn và dịch vụ giao hàng...'**
  String get reviewCommentHint;

  /// No description provided for @reviewSubmit.
  ///
  /// In vi, this message translates to:
  /// **'Gửi đánh giá'**
  String get reviewSubmit;

  /// No description provided for @reviewSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá thành công!'**
  String get reviewSuccess;

  /// No description provided for @reviewError.
  ///
  /// In vi, this message translates to:
  /// **'Có lỗi xảy ra. Vui lòng thử lại.'**
  String get reviewError;

  /// No description provided for @reviewRatingExcellent.
  ///
  /// In vi, this message translates to:
  /// **'Tuyệt vời!'**
  String get reviewRatingExcellent;

  /// No description provided for @reviewRatingGood.
  ///
  /// In vi, this message translates to:
  /// **'Tốt'**
  String get reviewRatingGood;

  /// No description provided for @reviewRatingAverage.
  ///
  /// In vi, this message translates to:
  /// **'Trung bình'**
  String get reviewRatingAverage;

  /// No description provided for @reviewRatingPoor.
  ///
  /// In vi, this message translates to:
  /// **'Kém'**
  String get reviewRatingPoor;

  /// No description provided for @reviewRatingBad.
  ///
  /// In vi, this message translates to:
  /// **'Rất tệ'**
  String get reviewRatingBad;

  /// No description provided for @driverDashboardToday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get driverDashboardToday;

  /// No description provided for @driverDashboardOrders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn gần đây'**
  String get driverDashboardOrders;

  /// No description provided for @driverDashboardNoOrders.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đơn hàng nào'**
  String get driverDashboardNoOrders;

  /// No description provided for @driverStatEarnings.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập'**
  String get driverStatEarnings;

  /// No description provided for @driverStatOnline.
  ///
  /// In vi, this message translates to:
  /// **'Online'**
  String get driverStatOnline;

  /// No description provided for @driverStatusTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trạng thái hoạt động'**
  String get driverStatusTitle;

  /// No description provided for @driverStatusPauseTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tạm dừng nhận đơn'**
  String get driverStatusPauseTitle;

  /// No description provided for @driverStatusPauseSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tạm dừng trong một khoảng thời gian, sau đó tự động trở lại trực tuyến.'**
  String get driverStatusPauseSubtitle;

  /// No description provided for @driverStatusPauseMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{minutes} phút'**
  String driverStatusPauseMinutes(int minutes);

  /// No description provided for @driverStatusPauseHours.
  ///
  /// In vi, this message translates to:
  /// **'{hours} giờ'**
  String driverStatusPauseHours(int hours);

  /// No description provided for @driverStatusResumeNow.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục nhận đơn ngay'**
  String get driverStatusResumeNow;

  /// No description provided for @driverStatusToday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get driverStatusToday;

  /// No description provided for @driverStatusOnlineTime.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian online'**
  String get driverStatusOnlineTime;

  /// No description provided for @driverStatusDurationMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{minutes}p'**
  String driverStatusDurationMinutes(int minutes);

  /// No description provided for @driverStatusDurationHoursMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{hours}g {minutes}p'**
  String driverStatusDurationHoursMinutes(int hours, int minutes);

  /// No description provided for @driverStatusInfoText.
  ///
  /// In vi, this message translates to:
  /// **'Khi trực tuyến, bạn sẽ nhận được thông báo đơn hàng mới trong khu vực hoạt động.'**
  String get driverStatusInfoText;

  /// No description provided for @driverEarningsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập'**
  String get driverEarningsTitle;

  /// No description provided for @driverEarningsPeriodToday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get driverEarningsPeriodToday;

  /// No description provided for @driverEarningsPeriodWeek.
  ///
  /// In vi, this message translates to:
  /// **'Tuần này'**
  String get driverEarningsPeriodWeek;

  /// No description provided for @driverEarningsPeriodMonth.
  ///
  /// In vi, this message translates to:
  /// **'Tháng này'**
  String get driverEarningsPeriodMonth;

  /// No description provided for @driverEarningsTotal.
  ///
  /// In vi, this message translates to:
  /// **'Tổng thu nhập'**
  String get driverEarningsTotal;

  /// No description provided for @driverEarningsAverage.
  ///
  /// In vi, this message translates to:
  /// **'Trung bình/đơn'**
  String get driverEarningsAverage;

  /// No description provided for @driverEarningsHistory.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử giao hàng'**
  String get driverEarningsHistory;

  /// No description provided for @driverEarningsEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có dữ liệu thu nhập'**
  String get driverEarningsEmpty;

  /// No description provided for @driverEarningsChartError.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải biểu đồ thu nhập'**
  String get driverEarningsChartError;

  /// No description provided for @driverEarningsChartRetry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driverEarningsChartRetry;

  /// No description provided for @driverRatingsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử đánh giá'**
  String get driverRatingsTitle;

  /// No description provided for @driverRatingsAll.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get driverRatingsAll;

  /// No description provided for @driverRatingsStars.
  ///
  /// In vi, this message translates to:
  /// **'{count} sao'**
  String driverRatingsStars(int count);

  /// No description provided for @driverRatingsEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đánh giá nào'**
  String get driverRatingsEmpty;

  /// No description provided for @driverRatingsError.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải đánh giá lúc này.'**
  String get driverRatingsError;

  /// No description provided for @driverRatingsRetry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driverRatingsRetry;

  /// No description provided for @driverRatingsOrder.
  ///
  /// In vi, this message translates to:
  /// **'ĐH: {code}'**
  String driverRatingsOrder(String code);

  /// No description provided for @driverRatingsToday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get driverRatingsToday;

  /// No description provided for @driverRatingsYesterday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm qua'**
  String get driverRatingsYesterday;

  /// No description provided for @driverTripDetailTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chi tiết chuyến đi'**
  String get driverTripDetailTitle;

  /// No description provided for @driverTripDetailSegments.
  ///
  /// In vi, this message translates to:
  /// **'Hướng dẫn từng chặng'**
  String get driverTripDetailSegments;

  /// No description provided for @driverTripDetailRetry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driverTripDetailRetry;

  /// No description provided for @driverTripDetailNoRoute.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có dữ liệu lộ trình cho chuyến này'**
  String get driverTripDetailNoRoute;

  /// No description provided for @driverTripDetailLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải lộ trình chuyến đi'**
  String get driverTripDetailLoadError;

  /// No description provided for @driverTripDetailOrder.
  ///
  /// In vi, this message translates to:
  /// **'ĐH: {code}'**
  String driverTripDetailOrder(String code);

  /// No description provided for @driverTripSummaryDistance.
  ///
  /// In vi, this message translates to:
  /// **'Khoảng cách'**
  String get driverTripSummaryDistance;

  /// No description provided for @driverTripSummaryDuration.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian'**
  String get driverTripSummaryDuration;

  /// No description provided for @driverTripSummaryAvgSpeed.
  ///
  /// In vi, this message translates to:
  /// **'Tốc độ TB'**
  String get driverTripSummaryAvgSpeed;

  /// No description provided for @driverTripSummaryEarnings.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập'**
  String get driverTripSummaryEarnings;

  /// No description provided for @driverTripSummaryCustomerRating.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá từ khách'**
  String get driverTripSummaryCustomerRating;

  /// No description provided for @driverTripSummaryMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{minutes} phút'**
  String driverTripSummaryMinutes(int minutes);

  /// No description provided for @driverRouteReplayTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Phát lại lộ trình'**
  String get driverRouteReplayTooltip;

  /// No description provided for @driverRouteReplayPlaying.
  ///
  /// In vi, this message translates to:
  /// **'Đang phát...'**
  String get driverRouteReplayPlaying;

  /// No description provided for @driverRouteReplayReady.
  ///
  /// In vi, this message translates to:
  /// **'Nhấn để phát lại'**
  String get driverRouteReplayReady;

  /// No description provided for @driverRouteReplayCompleted.
  ///
  /// In vi, this message translates to:
  /// **'Đã phát xong'**
  String get driverRouteReplayCompleted;

  /// No description provided for @driverKycTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh KYC'**
  String get driverKycTitle;

  /// No description provided for @driverKycUploadTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tải lên giấy tờ'**
  String get driverKycUploadTitle;

  /// No description provided for @driverKycUploadSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng tải lên đầy đủ các giấy tờ yêu cầu'**
  String get driverKycUploadSubtitle;

  /// No description provided for @driverKycCccdFront.
  ///
  /// In vi, this message translates to:
  /// **'CCCD mặt trước'**
  String get driverKycCccdFront;

  /// No description provided for @driverKycCccdBack.
  ///
  /// In vi, this message translates to:
  /// **'CCCD mặt sau'**
  String get driverKycCccdBack;

  /// No description provided for @driverKycDriverLicense.
  ///
  /// In vi, this message translates to:
  /// **'Bằng lái xe'**
  String get driverKycDriverLicense;

  /// No description provided for @driverKycVehicleReg.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký xe'**
  String get driverKycVehicleReg;

  /// No description provided for @driverKycTakePhoto.
  ///
  /// In vi, this message translates to:
  /// **'Chụp ảnh'**
  String get driverKycTakePhoto;

  /// No description provided for @driverKycGallery.
  ///
  /// In vi, this message translates to:
  /// **'Chọn từ thư viện'**
  String get driverKycGallery;

  /// No description provided for @driverKycUploadHint.
  ///
  /// In vi, this message translates to:
  /// **'Chụp ảnh hoặc tải lên'**
  String get driverKycUploadHint;

  /// No description provided for @driverKycSubmit.
  ///
  /// In vi, this message translates to:
  /// **'GỬI ĐĂNG KÝ'**
  String get driverKycSubmit;

  /// No description provided for @driverKycNote.
  ///
  /// In vi, this message translates to:
  /// **'Đơn xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.'**
  String get driverKycNote;

  /// No description provided for @driverKycSubmitFailed.
  ///
  /// In vi, this message translates to:
  /// **'Gửi đơn thất bại. Vui lòng thử lại.'**
  String get driverKycSubmitFailed;

  /// No description provided for @driverHistoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử giao hàng'**
  String get driverHistoryTitle;

  /// No description provided for @driverHistoryFilterDate.
  ///
  /// In vi, this message translates to:
  /// **'Lọc theo ngày'**
  String get driverHistoryFilterDate;

  /// No description provided for @driverHistoryEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch sử giao hàng'**
  String get driverHistoryEmpty;

  /// No description provided for @driverHistoryLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải lịch sử giao hàng. Vui lòng thử lại.'**
  String get driverHistoryLoadError;

  /// No description provided for @driverHistoryRetry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driverHistoryRetry;

  /// No description provided for @driverHistoryDeliveryFee.
  ///
  /// In vi, this message translates to:
  /// **'Phí giao hàng'**
  String get driverHistoryDeliveryFee;

  /// No description provided for @locationPermissionTitle.
  ///
  /// In vi, this message translates to:
  /// **'Cho phép truy cập vị trí'**
  String get locationPermissionTitle;

  /// No description provided for @locationPermissionSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'FoodFlow cần vị trí của bạn để tìm nhà hàng gần nhất và giao hàng chính xác hơn.'**
  String get locationPermissionSubtitle;

  /// No description provided for @locationPermissionAllow.
  ///
  /// In vi, this message translates to:
  /// **'Cho phép'**
  String get locationPermissionAllow;

  /// No description provided for @locationPermissionManual.
  ///
  /// In vi, this message translates to:
  /// **'Nhập địa chỉ thủ công'**
  String get locationPermissionManual;

  /// No description provided for @driverNavTitle.
  ///
  /// In vi, this message translates to:
  /// **'Giao hàng'**
  String get driverNavTitle;

  /// No description provided for @driverNavNoOrder.
  ///
  /// In vi, this message translates to:
  /// **'Không có đơn hàng đang thực hiện'**
  String get driverNavNoOrder;

  /// No description provided for @driverNavRestaurant.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng'**
  String get driverNavRestaurant;

  /// No description provided for @driverNavCallRestaurant.
  ///
  /// In vi, this message translates to:
  /// **'Gọi nhà hàng'**
  String get driverNavCallRestaurant;

  /// No description provided for @driverNavDeliveryAddress.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ giao hàng'**
  String get driverNavDeliveryAddress;

  /// No description provided for @driverNavArrivedAtRestaurant.
  ///
  /// In vi, this message translates to:
  /// **'ĐÃ ĐẾN NHÀ HÀNG'**
  String get driverNavArrivedAtRestaurant;

  /// No description provided for @driverNavPreparingFood.
  ///
  /// In vi, this message translates to:
  /// **'Đang chuẩn bị món'**
  String get driverNavPreparingFood;

  /// No description provided for @driverNavItemsToPickup.
  ///
  /// In vi, this message translates to:
  /// **'Món cần lấy'**
  String get driverNavItemsToPickup;

  /// No description provided for @driverNavConfirmPickup.
  ///
  /// In vi, this message translates to:
  /// **'XÁC NHẬN LẤY HÀNG'**
  String get driverNavConfirmPickup;

  /// No description provided for @driverNavEta.
  ///
  /// In vi, this message translates to:
  /// **'ETA - Thời gian dự kiến'**
  String get driverNavEta;

  /// No description provided for @driverNavEtaMinutes.
  ///
  /// In vi, this message translates to:
  /// **'Khoảng {minutes} phút'**
  String driverNavEtaMinutes(int minutes);

  /// No description provided for @driverNavEtaUnavailable.
  ///
  /// In vi, this message translates to:
  /// **'Đang chờ ETA từ tuyến đường'**
  String get driverNavEtaUnavailable;

  /// No description provided for @driverNavCustomerAddress.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ khách hàng'**
  String get driverNavCustomerAddress;

  /// No description provided for @driverNavCallCustomer.
  ///
  /// In vi, this message translates to:
  /// **'Gọi khách'**
  String get driverNavCallCustomer;

  /// No description provided for @driverNavConfirmDelivery.
  ///
  /// In vi, this message translates to:
  /// **'ĐÃ GIAO HÀNG'**
  String get driverNavConfirmDelivery;

  /// No description provided for @driverNavDeliverySuccess.
  ///
  /// In vi, this message translates to:
  /// **'Giao hàng thành công!'**
  String get driverNavDeliverySuccess;

  /// No description provided for @driverNavOrderTotal.
  ///
  /// In vi, this message translates to:
  /// **'Tổng đơn'**
  String get driverNavOrderTotal;

  /// No description provided for @driverNavYouEarned.
  ///
  /// In vi, this message translates to:
  /// **'Bạn nhận được'**
  String get driverNavYouEarned;

  /// No description provided for @driverNavGoHome.
  ///
  /// In vi, this message translates to:
  /// **'VỀ TRANG CHỦ'**
  String get driverNavGoHome;

  /// No description provided for @driverPickupTitle.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận lấy hàng'**
  String get driverPickupTitle;

  /// No description provided for @driverPickupRestaurantNoteTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lưu ý từ nhà hàng'**
  String get driverPickupRestaurantNoteTitle;

  /// No description provided for @driverPickupHint.
  ///
  /// In vi, this message translates to:
  /// **'Kiểm tra đủ món trước khi xác nhận'**
  String get driverPickupHint;

  /// No description provided for @driverPickupReportIssue.
  ///
  /// In vi, this message translates to:
  /// **'Báo vấn đề'**
  String get driverPickupReportIssue;

  /// No description provided for @driverPickupReportSupportMessage.
  ///
  /// In vi, this message translates to:
  /// **'Liên hệ hỗ trợ sẽ được kết nối ngay.'**
  String get driverPickupReportSupportMessage;

  /// No description provided for @driverPickupMissingTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không có dữ liệu đơn hàng để xác nhận.'**
  String get driverPickupMissingTitle;

  /// No description provided for @driverPickupMissingDescription.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng mở màn này từ đơn đang hoạt động.'**
  String get driverPickupMissingDescription;

  /// No description provided for @driverDeliveryCompleteSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Cảm ơn bạn đã hoàn thành chuyến giao hàng'**
  String get driverDeliveryCompleteSubtitle;

  /// No description provided for @driverDeliveryTripEarnings.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập chuyến này'**
  String get driverDeliveryTripEarnings;

  /// No description provided for @driverDeliveryBonus.
  ///
  /// In vi, this message translates to:
  /// **'Thưởng'**
  String get driverDeliveryBonus;

  /// No description provided for @driverDeliveryContinue.
  ///
  /// In vi, this message translates to:
  /// **'TIẾP TỤC NHẬN ĐƠN'**
  String get driverDeliveryContinue;

  /// No description provided for @driverDeliveryMissingTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không có dữ liệu thu nhập chuyến giao.'**
  String get driverDeliveryMissingTitle;

  /// No description provided for @driverDeliveryMissingDescription.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng mở màn này từ đơn vừa hoàn thành.'**
  String get driverDeliveryMissingDescription;

  /// No description provided for @driverNavPhoneError.
  ///
  /// In vi, this message translates to:
  /// **'Không thể mở trình quay số'**
  String get driverNavPhoneError;

  /// No description provided for @driverNavOpenDirections.
  ///
  /// In vi, this message translates to:
  /// **'Mở chỉ đường'**
  String get driverNavOpenDirections;

  /// No description provided for @driverNavDirectionsUnavailable.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tọa độ hợp lệ để chỉ đường'**
  String get driverNavDirectionsUnavailable;

  /// No description provided for @driverDispatchNewOrderTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng mới!'**
  String get driverDispatchNewOrderTitle;

  /// No description provided for @driverDispatchNewOrderSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Chấp nhận để bắt đầu giao hàng'**
  String get driverDispatchNewOrderSubtitle;

  /// No description provided for @driverDispatchRestaurantLabel.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng'**
  String get driverDispatchRestaurantLabel;

  /// No description provided for @driverDispatchDeliveryLabel.
  ///
  /// In vi, this message translates to:
  /// **'Giao đến'**
  String get driverDispatchDeliveryLabel;

  /// No description provided for @driverDispatchCountdownDecision.
  ///
  /// In vi, this message translates to:
  /// **'Còn {seconds} giây để quyết định'**
  String driverDispatchCountdownDecision(int seconds);

  /// No description provided for @driverDispatchCountdownUrgent.
  ///
  /// In vi, this message translates to:
  /// **'Sắp hết thời gian!'**
  String get driverDispatchCountdownUrgent;

  /// No description provided for @driverDispatchReject.
  ///
  /// In vi, this message translates to:
  /// **'Từ chối'**
  String get driverDispatchReject;

  /// No description provided for @driverDispatchAccept.
  ///
  /// In vi, this message translates to:
  /// **'Nhận đơn'**
  String get driverDispatchAccept;

  /// No description provided for @cartPlaceOrder.
  ///
  /// In vi, this message translates to:
  /// **'Đặt hàng'**
  String get cartPlaceOrder;

  /// No description provided for @checkoutConfirmOrder.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận đặt hàng'**
  String get checkoutConfirmOrder;

  /// No description provided for @onboardingSkip.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ qua'**
  String get onboardingSkip;

  /// No description provided for @onboardingNext.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp theo'**
  String get onboardingNext;

  /// No description provided for @onboardingGetStarted.
  ///
  /// In vi, this message translates to:
  /// **'Bắt đầu ngay'**
  String get onboardingGetStarted;

  /// No description provided for @onboardingWelcomeTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chào mừng đến FoodFlow'**
  String get onboardingWelcomeTitle;

  /// No description provided for @onboardingWelcomeSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Đặt đồ ăn yêu thích, giao tận nơi nhanh chóng'**
  String get onboardingWelcomeSubtitle;

  /// No description provided for @onboardingLocationTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tìm nhà hàng gần bạn'**
  String get onboardingLocationTitle;

  /// No description provided for @onboardingLocationSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Cho phép truy cập vị trí để tìm nhà hàng tốt nhất gần bạn'**
  String get onboardingLocationSubtitle;

  /// No description provided for @onboardingNotificationTitle.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật đơn hàng real-time'**
  String get onboardingNotificationTitle;

  /// No description provided for @onboardingNotificationSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhận thông báo khi đơn hàng được xác nhận và giao hàng'**
  String get onboardingNotificationSubtitle;

  /// No description provided for @loyaltyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Điểm thưởng'**
  String get loyaltyTitle;

  /// No description provided for @loyaltyPointsBalance.
  ///
  /// In vi, this message translates to:
  /// **'Số điểm hiện có'**
  String get loyaltyPointsBalance;

  /// No description provided for @loyaltyPoints.
  ///
  /// In vi, this message translates to:
  /// **'{count} điểm'**
  String loyaltyPoints(int count);

  /// No description provided for @loyaltyTierBronze.
  ///
  /// In vi, this message translates to:
  /// **'Đồng'**
  String get loyaltyTierBronze;

  /// No description provided for @loyaltyTierSilver.
  ///
  /// In vi, this message translates to:
  /// **'Bạc'**
  String get loyaltyTierSilver;

  /// No description provided for @loyaltyTierGold.
  ///
  /// In vi, this message translates to:
  /// **'Vàng'**
  String get loyaltyTierGold;

  /// No description provided for @loyaltyTierPlatinum.
  ///
  /// In vi, this message translates to:
  /// **'Bạch kim'**
  String get loyaltyTierPlatinum;

  /// No description provided for @loyaltyNextTier.
  ///
  /// In vi, this message translates to:
  /// **'Hạng tiếp theo'**
  String get loyaltyNextTier;

  /// No description provided for @loyaltyPointsToNextTier.
  ///
  /// In vi, this message translates to:
  /// **'Cần thêm {points} điểm để lên hạng'**
  String loyaltyPointsToNextTier(int points);

  /// No description provided for @loyaltyHistory.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử điểm'**
  String get loyaltyHistory;

  /// No description provided for @loyaltyHistoryEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch sử điểm thưởng'**
  String get loyaltyHistoryEmpty;

  /// No description provided for @loyaltyRedeem.
  ///
  /// In vi, this message translates to:
  /// **'Đổi điểm'**
  String get loyaltyRedeem;

  /// No description provided for @loyaltyEarnPoints.
  ///
  /// In vi, this message translates to:
  /// **'Cách kiếm điểm'**
  String get loyaltyEarnPoints;

  /// No description provided for @loyaltyEarnOrderDesc.
  ///
  /// In vi, this message translates to:
  /// **'Mỗi đơn hàng hoàn thành = 10 điểm'**
  String get loyaltyEarnOrderDesc;

  /// No description provided for @loyaltyEarnReferralDesc.
  ///
  /// In vi, this message translates to:
  /// **'Mỗi lần giới thiệu thành công = 50 điểm'**
  String get loyaltyEarnReferralDesc;

  /// No description provided for @walletTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ví điện tử'**
  String get walletTitle;

  /// No description provided for @walletBalance.
  ///
  /// In vi, this message translates to:
  /// **'Số dư'**
  String get walletBalance;

  /// No description provided for @walletTopUp.
  ///
  /// In vi, this message translates to:
  /// **'Nạp tiền'**
  String get walletTopUp;

  /// No description provided for @walletWithdraw.
  ///
  /// In vi, this message translates to:
  /// **'Rút tiền'**
  String get walletWithdraw;

  /// No description provided for @walletTransactionHistory.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử giao dịch'**
  String get walletTransactionHistory;

  /// No description provided for @walletTransactionEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có giao dịch nào'**
  String get walletTransactionEmpty;

  /// No description provided for @walletTopUpTitle.
  ///
  /// In vi, this message translates to:
  /// **'Nạp tiền vào ví'**
  String get walletTopUpTitle;

  /// No description provided for @walletSelectAmount.
  ///
  /// In vi, this message translates to:
  /// **'Chọn số tiền'**
  String get walletSelectAmount;

  /// No description provided for @walletConfirmTopUp.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận nạp tiền'**
  String get walletConfirmTopUp;

  /// No description provided for @walletDebit.
  ///
  /// In vi, this message translates to:
  /// **'Chi tiêu'**
  String get walletDebit;

  /// No description provided for @walletCredit.
  ///
  /// In vi, this message translates to:
  /// **'Nạp tiền'**
  String get walletCredit;

  /// No description provided for @walletReasonOrderPayment.
  ///
  /// In vi, this message translates to:
  /// **'Thanh toán đơn hàng'**
  String get walletReasonOrderPayment;

  /// No description provided for @walletReasonOrderRefund.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn tiền đơn hàng'**
  String get walletReasonOrderRefund;

  /// No description provided for @walletReasonWithdrawal.
  ///
  /// In vi, this message translates to:
  /// **'Rút tiền'**
  String get walletReasonWithdrawal;

  /// No description provided for @walletReasonAdjustment.
  ///
  /// In vi, this message translates to:
  /// **'Điều chỉnh số dư'**
  String get walletReasonAdjustment;

  /// No description provided for @referralTitle.
  ///
  /// In vi, this message translates to:
  /// **'Giới thiệu bạn bè'**
  String get referralTitle;

  /// No description provided for @referralSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ mã giới thiệu và nhận thưởng'**
  String get referralSubtitle;

  /// No description provided for @referralCode.
  ///
  /// In vi, this message translates to:
  /// **'Mã giới thiệu của bạn'**
  String get referralCode;

  /// No description provided for @referralCopyCode.
  ///
  /// In vi, this message translates to:
  /// **'Sao chép mã'**
  String get referralCopyCode;

  /// No description provided for @referralCodeCopied.
  ///
  /// In vi, this message translates to:
  /// **'Đã sao chép mã!'**
  String get referralCodeCopied;

  /// No description provided for @referralShareCode.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ mã'**
  String get referralShareCode;

  /// No description provided for @referralShareSheetTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ mã giới thiệu'**
  String get referralShareSheetTitle;

  /// No description provided for @referralShareMessage.
  ///
  /// In vi, this message translates to:
  /// **'Dùng mã {code} để nhận ưu đãi khi đặt đơn đầu tiên trên FoodFlow!'**
  String referralShareMessage(String code);

  /// No description provided for @referralInviteCount.
  ///
  /// In vi, this message translates to:
  /// **'Đã giới thiệu {count} người'**
  String referralInviteCount(int count);

  /// No description provided for @referralBonusEarned.
  ///
  /// In vi, this message translates to:
  /// **'Thưởng đã nhận'**
  String get referralBonusEarned;

  /// No description provided for @referralHowItWorks.
  ///
  /// In vi, this message translates to:
  /// **'Cách thức hoạt động'**
  String get referralHowItWorks;

  /// No description provided for @referralStep1.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ mã giới thiệu của bạn'**
  String get referralStep1;

  /// No description provided for @referralStep2.
  ///
  /// In vi, this message translates to:
  /// **'Bạn bè đăng ký và đặt đơn đầu tiên'**
  String get referralStep2;

  /// No description provided for @referralStep3.
  ///
  /// In vi, this message translates to:
  /// **'Cả hai cùng nhận 50 điểm thưởng'**
  String get referralStep3;

  /// No description provided for @helpTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trung tâm hỗ trợ'**
  String get helpTitle;

  /// No description provided for @helpSearchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm câu hỏi...'**
  String get helpSearchHint;

  /// No description provided for @helpFaq.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi thường gặp'**
  String get helpFaq;

  /// No description provided for @helpFaqEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy câu hỏi nào'**
  String get helpFaqEmpty;

  /// No description provided for @helpChatSupport.
  ///
  /// In vi, this message translates to:
  /// **'Chat hỗ trợ'**
  String get helpChatSupport;

  /// No description provided for @helpCallSupport.
  ///
  /// In vi, this message translates to:
  /// **'Gọi hỗ trợ'**
  String get helpCallSupport;

  /// No description provided for @helpEmailSupport.
  ///
  /// In vi, this message translates to:
  /// **'Email hỗ trợ'**
  String get helpEmailSupport;

  /// No description provided for @helpCategories.
  ///
  /// In vi, this message translates to:
  /// **'Danh mục'**
  String get helpCategories;

  /// No description provided for @helpCategoryOrders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng'**
  String get helpCategoryOrders;

  /// No description provided for @helpCategoryPayment.
  ///
  /// In vi, this message translates to:
  /// **'Thanh toán'**
  String get helpCategoryPayment;

  /// No description provided for @helpCategoryDelivery.
  ///
  /// In vi, this message translates to:
  /// **'Giao hàng'**
  String get helpCategoryDelivery;

  /// No description provided for @helpCategoryAccount.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản'**
  String get helpCategoryAccount;

  /// No description provided for @filterTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bộ lọc'**
  String get filterTitle;

  /// No description provided for @filterApply.
  ///
  /// In vi, this message translates to:
  /// **'Áp dụng'**
  String get filterApply;

  /// No description provided for @filterReset.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lại'**
  String get filterReset;

  /// No description provided for @filterRating.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá'**
  String get filterRating;

  /// No description provided for @filterDeliveryTime.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian giao'**
  String get filterDeliveryTime;

  /// No description provided for @filterPriceRange.
  ///
  /// In vi, this message translates to:
  /// **'Khoảng giá'**
  String get filterPriceRange;

  /// No description provided for @filterMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{min} phút'**
  String filterMinutes(int min);

  /// No description provided for @filterFreeDelivery.
  ///
  /// In vi, this message translates to:
  /// **'Giao hàng miễn phí'**
  String get filterFreeDelivery;

  /// No description provided for @filterOpenNow.
  ///
  /// In vi, this message translates to:
  /// **'Đang mở cửa'**
  String get filterOpenNow;

  /// No description provided for @addressPickerTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chọn địa chỉ'**
  String get addressPickerTitle;

  /// No description provided for @addressPickerSearchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm địa chỉ...'**
  String get addressPickerSearchHint;

  /// No description provided for @addressPickerUseCurrentLocation.
  ///
  /// In vi, this message translates to:
  /// **'Dùng vị trí hiện tại'**
  String get addressPickerUseCurrentLocation;

  /// No description provided for @addressPickerSaved.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ đã lưu'**
  String get addressPickerSaved;

  /// No description provided for @addressPickerNoSaved.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có địa chỉ đã lưu'**
  String get addressPickerNoSaved;

  /// No description provided for @addressPickerConfirm.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận địa chỉ này'**
  String get addressPickerConfirm;

  /// No description provided for @driver_onboarding_vehicle_title.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin phương tiện'**
  String get driver_onboarding_vehicle_title;

  /// No description provided for @driver_onboarding_vehicle_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Cho chúng tôi biết về xe của bạn'**
  String get driver_onboarding_vehicle_subtitle;

  /// No description provided for @driver_onboarding_vehicle_type_label.
  ///
  /// In vi, this message translates to:
  /// **'Loại phương tiện'**
  String get driver_onboarding_vehicle_type_label;

  /// No description provided for @driver_onboarding_vehicle_type_bike.
  ///
  /// In vi, this message translates to:
  /// **'Xe đạp'**
  String get driver_onboarding_vehicle_type_bike;

  /// No description provided for @driver_onboarding_vehicle_type_motorbike.
  ///
  /// In vi, this message translates to:
  /// **'Xe máy'**
  String get driver_onboarding_vehicle_type_motorbike;

  /// No description provided for @driver_onboarding_vehicle_type_car.
  ///
  /// In vi, this message translates to:
  /// **'Ô tô'**
  String get driver_onboarding_vehicle_type_car;

  /// No description provided for @driver_onboarding_plate_label.
  ///
  /// In vi, this message translates to:
  /// **'Biển số xe'**
  String get driver_onboarding_plate_label;

  /// No description provided for @driver_onboarding_plate_hint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập biển số xe'**
  String get driver_onboarding_plate_hint;

  /// No description provided for @driver_onboarding_plate_required.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập biển số'**
  String get driver_onboarding_plate_required;

  /// No description provided for @driver_onboarding_next.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp theo'**
  String get driver_onboarding_next;

  /// No description provided for @driver_onboarding_documents_title.
  ///
  /// In vi, this message translates to:
  /// **'Giấy tờ cần thiết'**
  String get driver_onboarding_documents_title;

  /// No description provided for @driver_onboarding_documents_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tải lên đầy đủ giấy tờ để được xét duyệt'**
  String get driver_onboarding_documents_subtitle;

  /// No description provided for @driver_onboarding_agreement_title.
  ///
  /// In vi, this message translates to:
  /// **'Điều khoản tài xế'**
  String get driver_onboarding_agreement_title;

  /// No description provided for @driver_onboarding_agreement_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Đọc và đồng ý với điều khoản để tham gia'**
  String get driver_onboarding_agreement_subtitle;

  /// No description provided for @driver_onboarding_agreement_read.
  ///
  /// In vi, this message translates to:
  /// **'Tôi đã đọc và đồng ý điều khoản dịch vụ'**
  String get driver_onboarding_agreement_read;

  /// No description provided for @driver_onboarding_agreement_accept.
  ///
  /// In vi, this message translates to:
  /// **'Đồng ý và tiếp tục'**
  String get driver_onboarding_agreement_accept;

  /// No description provided for @driver_onboarding_agreement_submit.
  ///
  /// In vi, this message translates to:
  /// **'GỬI ĐĂNG KÝ'**
  String get driver_onboarding_agreement_submit;

  /// No description provided for @driver_onboarding_agreement_note.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.'**
  String get driver_onboarding_agreement_note;

  /// No description provided for @driver_onboarding_agreement_terms.
  ///
  /// In vi, this message translates to:
  /// **'1. Dịch vụ tài xế FoodFlow\n\nKhi đăng ký làm tài xế FoodFlow, bạn đồng ý cung cấp dịch vụ giao hàng trong khu vực hoạt động đã được duyệt.\n\n2. Yêu cầu\n\n• Có giấy phép lái xe và giấy tờ phương tiện hợp lệ.\n• Sử dụng phương tiện an toàn, được bảo hiểm và đúng hồ sơ đăng ký.\n• Duy trì thái độ chuyên nghiệp, điểm đánh giá phù hợp và tuân thủ luật giao thông.\n• Bảo mật thông tin khách hàng, nhà hàng và đơn hàng.\n\n3. Thu nhập và thanh toán\n\nThu nhập được tính từ đơn hoàn thành, khoảng cách, ưu đãi và điều chỉnh đã được duyệt. Thanh toán hàng tuần qua tài khoản ngân hàng đã lưu trên FoodFlow.\n\n4. Hành vi và tiêu chuẩn\n\nTài xế phải lịch sự với khách hàng, nhà hàng và bộ phận hỗ trợ. Gian lận, lạm dụng, giao hàng không an toàn hoặc báo cáo sai có thể khiến tài khoản bị tạm ngưng hoặc chấm dứt.\n\n5. Chấm dứt\n\nFoodFlow có quyền tạm ngưng hoặc chấm dứt quyền truy cập nếu bạn vi phạm điều khoản, quy tắc an toàn hoặc yêu cầu pháp lý.'**
  String get driver_onboarding_agreement_terms;

  /// No description provided for @driver_onboarding_agreement_failed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể lưu xác nhận điều khoản. Vui lòng thử lại.'**
  String get driver_onboarding_agreement_failed;

  /// No description provided for @driver_incentives_title.
  ///
  /// In vi, this message translates to:
  /// **'Ưu đãi'**
  String get driver_incentives_title;

  /// No description provided for @driver_incentives_active.
  ///
  /// In vi, this message translates to:
  /// **'Đang diễn ra'**
  String get driver_incentives_active;

  /// No description provided for @driver_incentives_completed.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn thành'**
  String get driver_incentives_completed;

  /// No description provided for @driver_incentives_progress.
  ///
  /// In vi, this message translates to:
  /// **'{current}/{target} đơn'**
  String driver_incentives_progress(int current, int target);

  /// No description provided for @driver_incentives_reward.
  ///
  /// In vi, this message translates to:
  /// **'Thưởng: {amount}'**
  String driver_incentives_reward(String amount);

  /// No description provided for @driver_incentives_empty.
  ///
  /// In vi, this message translates to:
  /// **'Không có ưu đãi nào'**
  String get driver_incentives_empty;

  /// No description provided for @driver_incentives_error.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải ưu đãi'**
  String get driver_incentives_error;

  /// No description provided for @driver_incentives_retry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driver_incentives_retry;

  /// No description provided for @driver_incentives_expires.
  ///
  /// In vi, this message translates to:
  /// **'Hết hạn: {date}'**
  String driver_incentives_expires(String date);

  /// No description provided for @driver_heatmap_title.
  ///
  /// In vi, this message translates to:
  /// **'Bản đồ nhu cầu'**
  String get driver_heatmap_title;

  /// No description provided for @driver_heatmap_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Khu vực đang có nhu cầu giao hàng cao'**
  String get driver_heatmap_subtitle;

  /// No description provided for @driver_heatmap_high.
  ///
  /// In vi, this message translates to:
  /// **'Nhu cầu cao'**
  String get driver_heatmap_high;

  /// No description provided for @driver_heatmap_medium.
  ///
  /// In vi, this message translates to:
  /// **'Nhu cầu trung bình'**
  String get driver_heatmap_medium;

  /// No description provided for @driver_heatmap_low.
  ///
  /// In vi, this message translates to:
  /// **'Nhu cầu thấp'**
  String get driver_heatmap_low;

  /// No description provided for @driver_heatmap_legend.
  ///
  /// In vi, this message translates to:
  /// **'Chú giải màu sắc'**
  String get driver_heatmap_legend;

  /// No description provided for @driver_heatmap_window_now.
  ///
  /// In vi, this message translates to:
  /// **'Hiện tại'**
  String get driver_heatmap_window_now;

  /// No description provided for @driver_heatmap_window_next_hour.
  ///
  /// In vi, this message translates to:
  /// **'1 giờ tới'**
  String get driver_heatmap_window_next_hour;

  /// No description provided for @driver_heatmap_window_next_three_hours.
  ///
  /// In vi, this message translates to:
  /// **'3 giờ tới'**
  String get driver_heatmap_window_next_three_hours;

  /// No description provided for @driver_heatmap_window_today.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get driver_heatmap_window_today;

  /// No description provided for @driver_heatmap_missing_location_title.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có vị trí tài xế'**
  String get driver_heatmap_missing_location_title;

  /// No description provided for @driver_heatmap_missing_location_description.
  ///
  /// In vi, this message translates to:
  /// **'Hãy bật trực tuyến hoặc chờ GPS cập nhật để xem nhu cầu quanh vị trí thật của bạn.'**
  String get driver_heatmap_missing_location_description;

  /// No description provided for @driver_heatmap_empty_title.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có dữ liệu nhu cầu'**
  String get driver_heatmap_empty_title;

  /// No description provided for @driver_heatmap_empty_description.
  ///
  /// In vi, this message translates to:
  /// **'Dữ liệu sẽ hiển thị khi có đơn hàng trong khu vực hiện tại.'**
  String get driver_heatmap_empty_description;

  /// No description provided for @driver_heatmap_order_count.
  ///
  /// In vi, this message translates to:
  /// **'{count} đơn hàng'**
  String driver_heatmap_order_count(int count);

  /// No description provided for @driver_heatmap_avg_payout.
  ///
  /// In vi, this message translates to:
  /// **'Trung bình {amount}đ/đơn'**
  String driver_heatmap_avg_payout(String amount);

  /// No description provided for @driver_bank_title.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản ngân hàng'**
  String get driver_bank_title;

  /// No description provided for @driver_bank_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm tài khoản để nhận thanh toán hàng tuần'**
  String get driver_bank_subtitle;

  /// No description provided for @driver_bank_name_label.
  ///
  /// In vi, this message translates to:
  /// **'Tên ngân hàng'**
  String get driver_bank_name_label;

  /// No description provided for @driver_bank_name_hint.
  ///
  /// In vi, this message translates to:
  /// **'Chọn ngân hàng'**
  String get driver_bank_name_hint;

  /// No description provided for @driver_bank_account_label.
  ///
  /// In vi, this message translates to:
  /// **'Số tài khoản'**
  String get driver_bank_account_label;

  /// No description provided for @driver_bank_account_hint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập số tài khoản'**
  String get driver_bank_account_hint;

  /// No description provided for @driver_bank_account_required.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập số tài khoản'**
  String get driver_bank_account_required;

  /// No description provided for @driver_bank_save.
  ///
  /// In vi, this message translates to:
  /// **'Lưu tài khoản'**
  String get driver_bank_save;

  /// No description provided for @driver_bank_saved.
  ///
  /// In vi, this message translates to:
  /// **'Đã lưu tài khoản ngân hàng'**
  String get driver_bank_saved;

  /// No description provided for @driver_bank_verify.
  ///
  /// In vi, this message translates to:
  /// **'Xác minh tài khoản'**
  String get driver_bank_verify;

  /// No description provided for @driver_bank_add_title.
  ///
  /// In vi, this message translates to:
  /// **'Thêm tài khoản'**
  String get driver_bank_add_title;

  /// No description provided for @driver_bank_name_required.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn ngân hàng'**
  String get driver_bank_name_required;

  /// No description provided for @driver_bank_holder_label.
  ///
  /// In vi, this message translates to:
  /// **'Tên chủ tài khoản'**
  String get driver_bank_holder_label;

  /// No description provided for @driver_bank_holder_hint.
  ///
  /// In vi, this message translates to:
  /// **'NGUYEN VAN A'**
  String get driver_bank_holder_hint;

  /// No description provided for @driver_bank_holder_required.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập tên chủ tài khoản'**
  String get driver_bank_holder_required;

  /// No description provided for @driver_bank_linked_title.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản đã liên kết'**
  String get driver_bank_linked_title;

  /// No description provided for @driver_bank_default_badge.
  ///
  /// In vi, this message translates to:
  /// **'Mặc định'**
  String get driver_bank_default_badge;

  /// No description provided for @driver_bank_add_button.
  ///
  /// In vi, this message translates to:
  /// **'Thêm tài khoản ngân hàng'**
  String get driver_bank_add_button;

  /// No description provided for @driver_bank_save_failed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể cập nhật tài khoản. Vui lòng thử lại.'**
  String get driver_bank_save_failed;

  /// No description provided for @driver_bank_delete_tooltip.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tài khoản ngân hàng'**
  String get driver_bank_delete_tooltip;

  /// No description provided for @driver_bank_delete_title.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tài khoản ngân hàng?'**
  String get driver_bank_delete_title;

  /// No description provided for @driver_bank_delete_message.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản nhận thanh toán này sẽ bị gỡ khỏi hồ sơ tài xế.'**
  String get driver_bank_delete_message;

  /// No description provided for @driver_bank_delete_confirm.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get driver_bank_delete_confirm;

  /// No description provided for @driver_bank_cancel.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get driver_bank_cancel;

  /// No description provided for @driver_bank_retry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get driver_bank_retry;

  /// No description provided for @driver_tip_title.
  ///
  /// In vi, this message translates to:
  /// **'Điều chỉnh tip'**
  String get driver_tip_title;

  /// No description provided for @driver_tip_header_title.
  ///
  /// In vi, this message translates to:
  /// **'Khách hàng tip thêm bằng tiền mặt?'**
  String get driver_tip_header_title;

  /// No description provided for @driver_tip_order_prefix.
  ///
  /// In vi, this message translates to:
  /// **'Đơn từ'**
  String get driver_tip_order_prefix;

  /// No description provided for @driver_tip_customer_prefix.
  ///
  /// In vi, this message translates to:
  /// **'Khách'**
  String get driver_tip_customer_prefix;

  /// No description provided for @driver_tip_picker_title.
  ///
  /// In vi, this message translates to:
  /// **'Chọn số tiền tip'**
  String get driver_tip_picker_title;

  /// No description provided for @driver_tip_custom_title.
  ///
  /// In vi, this message translates to:
  /// **'Hoặc nhập số tiền khác'**
  String get driver_tip_custom_title;

  /// No description provided for @driver_tip_custom_hint.
  ///
  /// In vi, this message translates to:
  /// **'Nhập số tiền (VNĐ)'**
  String get driver_tip_custom_hint;

  /// No description provided for @driver_tip_skip.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ qua'**
  String get driver_tip_skip;

  /// No description provided for @driver_tip_confirm.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận'**
  String get driver_tip_confirm;

  /// No description provided for @driver_tip_success_snackbar.
  ///
  /// In vi, this message translates to:
  /// **'Đã lưu báo cáo tip'**
  String get driver_tip_success_snackbar;

  /// No description provided for @driver_tip_success_message.
  ///
  /// In vi, this message translates to:
  /// **'Báo cáo tip đã được lưu để đối soát. Thanh toán không tự động thay đổi.'**
  String get driver_tip_success_message;

  /// No description provided for @driver_notifications_read_all.
  ///
  /// In vi, this message translates to:
  /// **'Đọc tất cả'**
  String get driver_notifications_read_all;

  /// No description provided for @driver_notifications_all.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get driver_notifications_all;

  /// No description provided for @driver_notifications_orders.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng'**
  String get driver_notifications_orders;

  /// No description provided for @driver_notifications_rewards.
  ///
  /// In vi, this message translates to:
  /// **'Thưởng'**
  String get driver_notifications_rewards;

  /// No description provided for @driver_notifications_system.
  ///
  /// In vi, this message translates to:
  /// **'Hệ thống'**
  String get driver_notifications_system;

  /// No description provided for @driver_notifications_empty_title.
  ///
  /// In vi, this message translates to:
  /// **'Không có thông báo'**
  String get driver_notifications_empty_title;

  /// No description provided for @driver_notifications_empty_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Bạn chưa có thông báo tài xế nào.'**
  String get driver_notifications_empty_subtitle;

  /// No description provided for @driver_notifications_load_failed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải thông báo'**
  String get driver_notifications_load_failed;

  /// No description provided for @driver_notifications_now.
  ///
  /// In vi, this message translates to:
  /// **'vừa xong'**
  String get driver_notifications_now;

  /// No description provided for @driver_notifications_minute_suffix.
  ///
  /// In vi, this message translates to:
  /// **' phút'**
  String get driver_notifications_minute_suffix;

  /// No description provided for @driver_notifications_hour_suffix.
  ///
  /// In vi, this message translates to:
  /// **' giờ'**
  String get driver_notifications_hour_suffix;

  /// No description provided for @driver_notifications_day_suffix.
  ///
  /// In vi, this message translates to:
  /// **' ngày'**
  String get driver_notifications_day_suffix;

  /// No description provided for @driver_support_title.
  ///
  /// In vi, this message translates to:
  /// **'Hỗ trợ tài xế'**
  String get driver_support_title;

  /// No description provided for @driver_support_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi luôn sẵn sàng giúp đỡ bạn'**
  String get driver_support_subtitle;

  /// No description provided for @driver_support_faq.
  ///
  /// In vi, this message translates to:
  /// **'Câu hỏi thường gặp'**
  String get driver_support_faq;

  /// No description provided for @driver_support_contact.
  ///
  /// In vi, this message translates to:
  /// **'Liên hệ hỗ trợ'**
  String get driver_support_contact;

  /// No description provided for @driver_support_chat.
  ///
  /// In vi, this message translates to:
  /// **'Chat trực tiếp'**
  String get driver_support_chat;

  /// No description provided for @driver_support_email.
  ///
  /// In vi, this message translates to:
  /// **'Gửi email'**
  String get driver_support_email;

  /// No description provided for @driver_support_phone.
  ///
  /// In vi, this message translates to:
  /// **'Hotline: 1800-xxxx'**
  String get driver_support_phone;

  /// No description provided for @driver_support_faq_q1.
  ///
  /// In vi, this message translates to:
  /// **'Tôi nhận tiền vào khi nào?'**
  String get driver_support_faq_q1;

  /// No description provided for @driver_support_faq_a1.
  ///
  /// In vi, this message translates to:
  /// **'Thu nhập được chuyển vào tài khoản ngân hàng mỗi thứ Hai hàng tuần.'**
  String get driver_support_faq_a1;

  /// No description provided for @driver_support_faq_q2.
  ///
  /// In vi, this message translates to:
  /// **'Làm sao để thay đổi khu vực giao hàng?'**
  String get driver_support_faq_q2;

  /// No description provided for @driver_support_faq_a2.
  ///
  /// In vi, this message translates to:
  /// **'Vào Cài đặt > Khu vực hoạt động để thay đổi.'**
  String get driver_support_faq_a2;

  /// No description provided for @driver_settings_title.
  ///
  /// In vi, this message translates to:
  /// **'Cài đặt'**
  String get driver_settings_title;

  /// No description provided for @driver_settings_notifications.
  ///
  /// In vi, this message translates to:
  /// **'Thông báo đẩy'**
  String get driver_settings_notifications;

  /// No description provided for @driver_settings_notifications_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhận thông báo về đơn hàng mới'**
  String get driver_settings_notifications_subtitle;

  /// No description provided for @driver_settings_language.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ'**
  String get driver_settings_language;

  /// No description provided for @driver_settings_language_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Việt'**
  String get driver_settings_language_subtitle;

  /// No description provided for @driver_settings_privacy.
  ///
  /// In vi, this message translates to:
  /// **'Chính sách bảo mật'**
  String get driver_settings_privacy;

  /// No description provided for @driver_settings_about.
  ///
  /// In vi, this message translates to:
  /// **'Về ứng dụng'**
  String get driver_settings_about;

  /// No description provided for @driver_settings_logout.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get driver_settings_logout;

  /// No description provided for @driver_settings_logout_confirm.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc muốn đăng xuất?'**
  String get driver_settings_logout_confirm;

  /// No description provided for @driver_settings_sound.
  ///
  /// In vi, this message translates to:
  /// **'Âm thanh thông báo'**
  String get driver_settings_sound;

  /// No description provided for @driver_settings_sound_subtitle.
  ///
  /// In vi, this message translates to:
  /// **'Phát âm thanh khi có đơn hàng mới'**
  String get driver_settings_sound_subtitle;

  /// No description provided for @driver_settings_version.
  ///
  /// In vi, this message translates to:
  /// **'Phiên bản {version}'**
  String driver_settings_version(String version);

  /// No description provided for @favoritesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Yêu thích'**
  String get favoritesTitle;

  /// No description provided for @favoritesEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có nhà hàng yêu thích'**
  String get favoritesEmpty;

  /// No description provided for @favoritesEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Hãy khám phá và thêm vào danh sách yêu thích của bạn'**
  String get favoritesEmptySubtitle;

  /// No description provided for @favoritesEmptyCta.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá nhà hàng'**
  String get favoritesEmptyCta;

  /// No description provided for @searchInputHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm món ăn, nhà hàng...'**
  String get searchInputHint;

  /// No description provided for @searchButtonLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tìm'**
  String get searchButtonLabel;

  /// No description provided for @searchRecentLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm gần đây'**
  String get searchRecentLabel;

  /// No description provided for @searchClearAll.
  ///
  /// In vi, this message translates to:
  /// **'Xóa tất cả'**
  String get searchClearAll;

  /// No description provided for @searchEmptyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm món ăn, nhà hàng'**
  String get searchEmptyTitle;

  /// No description provided for @searchEmptySubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhập tên món hoặc nhà hàng bạn muốn tìm'**
  String get searchEmptySubtitle;

  /// No description provided for @searchNoResults.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy kết quả cho \"{query}\"'**
  String searchNoResults(String query);

  /// No description provided for @searchNoResultsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thử từ khóa khác hoặc thay đổi bộ lọc'**
  String get searchNoResultsSubtitle;

  /// No description provided for @searchClosedBadge.
  ///
  /// In vi, this message translates to:
  /// **'Đóng cửa'**
  String get searchClosedBadge;

  /// No description provided for @searchFilterNearest.
  ///
  /// In vi, this message translates to:
  /// **'Gần nhất'**
  String get searchFilterNearest;

  /// No description provided for @searchFilterTopRated.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá cao'**
  String get searchFilterTopRated;

  /// No description provided for @searchFilterPriceLowHigh.
  ///
  /// In vi, this message translates to:
  /// **'Giá thấp → cao'**
  String get searchFilterPriceLowHigh;

  /// No description provided for @searchFilterOpenNow.
  ///
  /// In vi, this message translates to:
  /// **'Đang mở'**
  String get searchFilterOpenNow;

  /// No description provided for @vouchersTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ưu đãi & Voucher'**
  String get vouchersTitle;

  /// No description provided for @vouchersTabMine.
  ///
  /// In vi, this message translates to:
  /// **'Của tôi'**
  String get vouchersTabMine;

  /// No description provided for @vouchersTabAvailable.
  ///
  /// In vi, this message translates to:
  /// **'Khả dụng'**
  String get vouchersTabAvailable;

  /// No description provided for @vouchersTabExpired.
  ///
  /// In vi, this message translates to:
  /// **'Hết hạn'**
  String get vouchersTabExpired;

  /// No description provided for @vouchersCodeCopied.
  ///
  /// In vi, this message translates to:
  /// **'Đã sao chép mã'**
  String get vouchersCodeCopied;

  /// No description provided for @vouchersEmptyMine.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có voucher'**
  String get vouchersEmptyMine;

  /// No description provided for @vouchersEmptyAvailable.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có voucher khả dụng'**
  String get vouchersEmptyAvailable;

  /// No description provided for @vouchersEmptyAvailableSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá các voucher đang có sẵn'**
  String get vouchersEmptyAvailableSubtitle;

  /// No description provided for @vouchersEmptyExpired.
  ///
  /// In vi, this message translates to:
  /// **'Không có voucher hết hạn'**
  String get vouchersEmptyExpired;

  /// No description provided for @vouchersEmptyExpiredSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Voucher hết hạn sẽ xuất hiện ở đây'**
  String get vouchersEmptyExpiredSubtitle;

  /// No description provided for @vouchersUseNow.
  ///
  /// In vi, this message translates to:
  /// **'Dùng ngay'**
  String get vouchersUseNow;

  /// No description provided for @vouchersPercentOff.
  ///
  /// In vi, this message translates to:
  /// **'Giảm {percent}%'**
  String vouchersPercentOff(int percent);

  /// No description provided for @vouchersMinOrder.
  ///
  /// In vi, this message translates to:
  /// **'Đơn tối thiểu {amount}'**
  String vouchersMinOrder(String amount);

  /// No description provided for @vouchersExpiresAt.
  ///
  /// In vi, this message translates to:
  /// **'HSD: {date}'**
  String vouchersExpiresAt(String date);

  /// No description provided for @cancelOrderTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hủy đơn hàng'**
  String get cancelOrderTitle;

  /// No description provided for @cancelOrderSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đã hủy đơn hàng thành công'**
  String get cancelOrderSuccess;

  /// No description provided for @cancelOrderFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể hủy đơn hàng'**
  String get cancelOrderFailed;

  /// No description provided for @cancelOrderInfoHeader.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin đơn hàng'**
  String get cancelOrderInfoHeader;

  /// No description provided for @cancelOrderReasonHeader.
  ///
  /// In vi, this message translates to:
  /// **'Chọn lý do hủy'**
  String get cancelOrderReasonHeader;

  /// No description provided for @cancelOrderReasonSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Chúng tôi rất tiếc nếu có điều gì không như ý'**
  String get cancelOrderReasonSubtitle;

  /// No description provided for @cancelOrderReasonSlow.
  ///
  /// In vi, this message translates to:
  /// **'Nhà hàng quá lâu'**
  String get cancelOrderReasonSlow;

  /// No description provided for @cancelOrderReasonChanged.
  ///
  /// In vi, this message translates to:
  /// **'Đổi ý'**
  String get cancelOrderReasonChanged;

  /// No description provided for @cancelOrderReasonWrong.
  ///
  /// In vi, this message translates to:
  /// **'Đặt nhầm'**
  String get cancelOrderReasonWrong;

  /// No description provided for @cancelOrderReasonOther.
  ///
  /// In vi, this message translates to:
  /// **'Khác'**
  String get cancelOrderReasonOther;

  /// No description provided for @cancelOrderNoteHint.
  ///
  /// In vi, this message translates to:
  /// **'Ghi chú thêm (tùy chọn)'**
  String get cancelOrderNoteHint;

  /// No description provided for @cancelOrderRefundNote.
  ///
  /// In vi, this message translates to:
  /// **'Hoàn tiền trong 3-5 ngày làm việc'**
  String get cancelOrderRefundNote;

  /// No description provided for @cancelOrderConfirmCta.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận hủy'**
  String get cancelOrderConfirmCta;

  /// No description provided for @helpCenterSearchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm câu hỏi...'**
  String get helpCenterSearchHint;

  /// No description provided for @helpCenterChatCta.
  ///
  /// In vi, this message translates to:
  /// **'Chat với hỗ trợ'**
  String get helpCenterChatCta;

  /// No description provided for @helpCenterNoResults.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy câu hỏi phù hợp'**
  String get helpCenterNoResults;

  /// No description provided for @helpFaqCancelOrderQ.
  ///
  /// In vi, this message translates to:
  /// **'Làm thế nào để hủy đơn hàng?'**
  String get helpFaqCancelOrderQ;

  /// No description provided for @helpFaqCancelOrderA.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có thể hủy đơn hàng trong vòng 2 phút sau khi đặt. Vào \"Đơn hàng\" → chọn đơn → nhấn \"Hủy đơn\".'**
  String get helpFaqCancelOrderA;

  /// No description provided for @helpFaqLateDeliveryQ.
  ///
  /// In vi, this message translates to:
  /// **'Đơn hàng bị trễ phải làm gì?'**
  String get helpFaqLateDeliveryQ;

  /// No description provided for @helpFaqLateDeliveryA.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng liên hệ chat hỗ trợ để chúng tôi kiểm tra trực tiếp với tài xế.'**
  String get helpFaqLateDeliveryA;

  /// No description provided for @helpFaqPaymentMethodsQ.
  ///
  /// In vi, this message translates to:
  /// **'Phương thức thanh toán nào được chấp nhận?'**
  String get helpFaqPaymentMethodsQ;

  /// No description provided for @helpFaqPaymentMethodsA.
  ///
  /// In vi, this message translates to:
  /// **'Hiện tại chúng tôi chấp nhận tiền mặt khi nhận hàng và ví điện tử FoodFlow.'**
  String get helpFaqPaymentMethodsA;

  /// No description provided for @helpFaqTopUpWalletQ.
  ///
  /// In vi, this message translates to:
  /// **'Làm thế nào để nạp tiền vào ví?'**
  String get helpFaqTopUpWalletQ;

  /// No description provided for @helpFaqTopUpWalletA.
  ///
  /// In vi, this message translates to:
  /// **'Vào \"Cá nhân\" → \"Ví điện tử\" → nhấn \"Nạp tiền\" và chọn mệnh giá mong muốn.'**
  String get helpFaqTopUpWalletA;

  /// No description provided for @helpFaqAddAddressQ.
  ///
  /// In vi, this message translates to:
  /// **'Làm sao để thêm địa chỉ giao hàng?'**
  String get helpFaqAddAddressQ;

  /// No description provided for @helpFaqAddAddressA.
  ///
  /// In vi, this message translates to:
  /// **'Vào \"Cá nhân\" → \"Địa chỉ của tôi\" → nhấn \"Thêm địa chỉ\" và nhập thông tin.'**
  String get helpFaqAddAddressA;

  /// No description provided for @helpFaqMissingOrderQ.
  ///
  /// In vi, this message translates to:
  /// **'Tôi không nhận được đơn hàng, phải làm gì?'**
  String get helpFaqMissingOrderQ;

  /// No description provided for @helpFaqMissingOrderA.
  ///
  /// In vi, this message translates to:
  /// **'Nếu tài xế đã đánh dấu giao thành công nhưng bạn chưa nhận được, hãy liên hệ hỗ trợ ngay.'**
  String get helpFaqMissingOrderA;

  /// No description provided for @helpFaqRewardPointsQ.
  ///
  /// In vi, this message translates to:
  /// **'Điểm thưởng được tích như thế nào?'**
  String get helpFaqRewardPointsQ;

  /// No description provided for @helpFaqRewardPointsA.
  ///
  /// In vi, this message translates to:
  /// **'Mỗi đơn hàng hoàn thành bạn nhận được 10 điểm. Giới thiệu bạn bè thành công nhận thêm 50 điểm.'**
  String get helpFaqRewardPointsA;

  /// No description provided for @helpFaqTrackOrderQ.
  ///
  /// In vi, this message translates to:
  /// **'Làm sao để theo dõi đơn hàng real-time?'**
  String get helpFaqTrackOrderQ;

  /// No description provided for @helpFaqTrackOrderA.
  ///
  /// In vi, this message translates to:
  /// **'Sau khi đặt hàng thành công, vào \"Đơn hàng\" → chọn đơn đang hoạt động → nhấn \"Theo dõi\".'**
  String get helpFaqTrackOrderA;
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
