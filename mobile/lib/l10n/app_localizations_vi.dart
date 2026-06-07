// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get loginTitle => 'Đăng nhập';

  @override
  String get loginWelcomeBack => 'Chào mừng bạn quay trở lại';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailHint => 'Nhập email của bạn';

  @override
  String get emailRequired => 'Vui lòng nhập email';

  @override
  String get emailInvalid => 'Email không hợp lệ';

  @override
  String get passwordLabel => 'Mật khẩu';

  @override
  String get passwordHint => 'Nhập mật khẩu';

  @override
  String get passwordRequired => 'Vui lòng nhập mật khẩu';

  @override
  String get passwordMinLength => 'Mật khẩu phải có ít nhất 6 ký tự';

  @override
  String get forgotPassword => 'Quên mật khẩu?';

  @override
  String get forgotPasswordTitle => 'Quên mật khẩu';

  @override
  String get forgotPasswordContent =>
      'Vui lòng liên hệ hỗ trợ qua email để được cấp lại mật khẩu.';

  @override
  String get close => 'Đóng';

  @override
  String get loginButton => 'Đăng nhập';

  @override
  String get noAccount => 'Chưa có tài khoản?';

  @override
  String get registerLink => 'Đăng ký';

  @override
  String get registerAsDriver => 'Đăng ký làm tài xế';

  @override
  String get registerTitle => 'Đăng ký';

  @override
  String get registerCreateAccount => 'Tạo tài khoản mới';

  @override
  String get registerSubtitle => 'Điền thông tin để bắt đầu sử dụng FoodFlow';

  @override
  String get fullNameLabel => 'Họ và tên';

  @override
  String get fullNameHint => 'Nhập họ và tên';

  @override
  String get fullNameRequired => 'Vui lòng nhập họ và tên';

  @override
  String get fullNameMinLength => 'Họ tên phải có ít nhất 2 ký tự';

  @override
  String get phoneLabel => 'Số điện thoại';

  @override
  String get phoneHint => 'Nhập số điện thoại';

  @override
  String get phoneRequired => 'Vui lòng nhập số điện thoại';

  @override
  String get phoneInvalid => 'Số điện thoại không hợp lệ';

  @override
  String get passwordHintLong => 'Nhập mật khẩu (ít nhất 6 ký tự)';

  @override
  String get confirmPasswordLabel => 'Xác nhận mật khẩu';

  @override
  String get confirmPasswordHint => 'Nhập lại mật khẩu';

  @override
  String get confirmPasswordRequired => 'Vui lòng xác nhận mật khẩu';

  @override
  String get passwordMismatch => 'Mật khẩu không khớp';

  @override
  String get registerAs => 'Bạn muốn đăng ký với tư cách?';

  @override
  String get roleCustomer => 'Khách hàng';

  @override
  String get roleDriver => 'Tài xế';

  @override
  String get registerButton => 'Đăng ký';

  @override
  String get hasAccount => 'Đã có tài khoản?';

  @override
  String get greetingAnonymous => 'Xin chào!';

  @override
  String greetingNamed(String name) {
    return 'Xin chào, $name!';
  }

  @override
  String get homeQuestion => 'Bạn muốn ăn gì hôm nay?';

  @override
  String get locating => 'Đang xác định vị trí...';

  @override
  String get searchHint => 'Tìm kiếm món ăn, nhà hàng...';

  @override
  String get nearbyRestaurants => 'Nhà hàng gần bạn';

  @override
  String get viewAll => 'Xem tất cả';

  @override
  String get loadingRestaurants => 'Đang tìm nhà hàng gần bạn...';

  @override
  String get noRestaurantsTitle => 'Không tìm thấy nhà hàng nào';

  @override
  String get noRestaurantsSubtitle => 'Hãy thử mở rộng khu vực tìm kiếm';

  @override
  String get reload => 'Tải lại';

  @override
  String get navHome => 'Trang chủ';

  @override
  String get navSearch => 'Tìm kiếm';

  @override
  String get navCart => 'Giỏ hàng';

  @override
  String get navOrders => 'Đơn hàng';

  @override
  String get navProfile => 'Cá nhân';

  @override
  String get navEarnings => 'Thu nhập';

  @override
  String get cuisineAll => 'Tất cả';

  @override
  String get cuisineFastFood => 'Đồ ăn nhanh';

  @override
  String get cuisineVietnamese => 'Việt Nam';

  @override
  String get cuisineJapanese => 'Nhật Bản';

  @override
  String get cuisineKorean => 'Hàn Quốc';

  @override
  String get cuisineChinese => 'Trung Hoa';

  @override
  String get cuisineDessert => 'Tráng miệng';

  @override
  String get cuisineDrinks => 'Đồ uống';

  @override
  String get profileTitle => 'Cá nhân';

  @override
  String get defaultUser => 'Người dùng';

  @override
  String get statsOrders => 'Đơn hàng';

  @override
  String get statsReviews => 'Đánh giá';

  @override
  String get statsAddresses => 'Địa chỉ';

  @override
  String get statsPoints => 'Điểm';

  @override
  String get myAddresses => 'Địa chỉ của tôi';

  @override
  String get myAddressesSubtitle => 'Quản lý địa chỉ giao hàng';

  @override
  String get paymentMethods => 'Phương thức thanh toán';

  @override
  String get paymentMethodsSubtitle => 'Thêm hoặc thay đổi phương thức';

  @override
  String get notificationsTitle => 'Thông báo';

  @override
  String get notificationsSubtitle => 'Quản lý thông báo đẩy';

  @override
  String get favorites => 'Yêu thích';

  @override
  String get favoritesSubtitle => 'Danh sách món ăn yêu thích';

  @override
  String get support => 'Hỗ trợ';

  @override
  String get supportSubtitle => 'Trung tâm trợ giúp';

  @override
  String get aboutApp => 'Về FoodFlow';

  @override
  String get aboutSubtitle => 'Phiên bản 1.0.0';

  @override
  String get logout => 'Đăng xuất';

  @override
  String get logoutConfirm => 'Bạn có chắc muốn đăng xuất?';

  @override
  String get cancel => 'Hủy';

  @override
  String get featureInDevelopment => 'Tính năng đang phát triển';

  @override
  String get driverProfileTitle => 'Hồ sơ';

  @override
  String get defaultDriver => 'Tài xế';

  @override
  String get vehicleInfo => 'Thông tin phương tiện';

  @override
  String get vehicleType => 'Loại xe';

  @override
  String get vehiclePlate => 'Biển số';

  @override
  String get statistics => 'Thống kê';

  @override
  String get totalDeliveries => 'Tổng số đơn';

  @override
  String get totalEarnings => 'Tổng thu nhập';

  @override
  String get languageTitle => 'Ngôn ngữ';

  @override
  String get languageVi => 'Tiếng Việt';

  @override
  String get languageEn => 'English';

  @override
  String get languageJa => '日本語';

  @override
  String get orderStatusPending => 'Đang chờ';

  @override
  String get orderStatusConfirmed => 'Đã xác nhận';

  @override
  String get orderStatusPreparing => 'Đang chuẩn bị';

  @override
  String get orderStatusPickedUp => 'Đang giao';

  @override
  String get orderStatusDelivered => 'Đã giao';

  @override
  String get orderStatusCancelled => 'Đã hủy';
}
