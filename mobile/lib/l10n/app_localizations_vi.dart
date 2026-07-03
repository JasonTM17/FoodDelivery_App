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
  String get profileLoyalty => 'Tích điểm thưởng';

  @override
  String get profileLoyaltySubtitle => 'Xem điểm và đổi quà';

  @override
  String get profileWallet => 'Ví của tôi';

  @override
  String get profileWalletSubtitle => 'Số dư và lịch sử giao dịch';

  @override
  String get profileReferral => 'Mời bạn bè';

  @override
  String get profileReferralSubtitle => 'Nhận thưởng khi giới thiệu';

  @override
  String get profileHelp => 'Trợ giúp & FAQ';

  @override
  String get profileHelpSubtitle => 'Câu hỏi thường gặp + liên hệ';

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

  @override
  String get cartTitle => 'Giỏ hàng';

  @override
  String get cartEmpty => 'Giỏ hàng trống';

  @override
  String get cartEmptySubtitle => 'Hãy thêm món ăn vào giỏ hàng';

  @override
  String get cartClearTitle => 'Xóa giỏ hàng?';

  @override
  String get cartClearContent =>
      'Bạn có chắc muốn xóa tất cả món trong giỏ hàng?';

  @override
  String get cartKeep => 'Giữ lại';

  @override
  String get cartClearAll => 'Xóa tất cả';

  @override
  String get cartPromoCode => 'Mã khuyến mãi';

  @override
  String get cartPromoHint => 'Nhập mã giảm giá';

  @override
  String get cartPromoRemove => 'Bỏ';

  @override
  String get cartPromoApply => 'Áp dụng';

  @override
  String cartPromoApplied(String code) {
    return 'Đã áp dụng mã $code';
  }

  @override
  String get cartSubtotal => 'Tạm tính';

  @override
  String get cartDeliveryFee => 'Phí giao hàng';

  @override
  String get cartFreeDelivery => 'Miễn phí';

  @override
  String get cartDiscountLabel => 'Giảm giá';

  @override
  String get cartGrandTotal => 'Tổng cộng';

  @override
  String get cartViewCart => 'Xem giỏ hàng';

  @override
  String get cartDelete => 'Xóa';

  @override
  String get checkoutTitle => 'Thanh toán';

  @override
  String get checkoutDeliveryAddress => 'Địa chỉ giao hàng';

  @override
  String get checkoutNoAddress => 'Chưa có địa chỉ nào';

  @override
  String get checkoutNoAddressSubtitle => 'Thêm địa chỉ để tiếp tục đặt hàng';

  @override
  String get checkoutAddAddress => 'Thêm địa chỉ mới';

  @override
  String get checkoutPaymentMethod => 'Phương thức thanh toán';

  @override
  String get checkoutPaymentCash => 'Tiền mặt';

  @override
  String get checkoutPaymentCashSubtitle => 'Thanh toán khi nhận hàng';

  @override
  String get checkoutPaymentWallet => 'Ví điện tử';

  @override
  String get checkoutNoteForDriver => 'Ghi chú cho tài xế';

  @override
  String get checkoutNoteHint => 'Thêm ghi chú...';

  @override
  String get checkoutOrderSummary => 'Tóm tắt đơn hàng';

  @override
  String get checkoutSelectAddress => 'Vui lòng chọn địa chỉ giao hàng';

  @override
  String get checkoutOrderFailed => 'Đặt hàng thất bại';

  @override
  String get addressDefault => 'Mặc định';

  @override
  String get restaurantListTitle => 'Quanh đây';

  @override
  String get restaurantViewList => 'Danh sách';

  @override
  String get restaurantViewMap => 'Bản đồ';

  @override
  String get restaurantNoResults => 'Không có nhà hàng nào';

  @override
  String get restaurantNoResultsSubtitle => 'Thử chọn bộ lọc khác';

  @override
  String get restaurantMenuTab => 'Thực đơn';

  @override
  String get restaurantReviewsTab => 'Đánh giá';

  @override
  String get restaurantInfoTab => 'Thông tin';

  @override
  String get restaurantMenuEmpty => 'Thực đơn đang cập nhật';

  @override
  String get restaurantMenuEmptySubtitle =>
      'Nhà hàng chưa có món nào trong thực đơn';

  @override
  String get restaurantNoReviews => 'Chưa có đánh giá nào';

  @override
  String get restaurantInfoTitle => 'Thông tin nhà hàng';

  @override
  String get foodPopular => 'Phổ biến';

  @override
  String get foodSpecialNote => 'Ghi chú đặc biệt';

  @override
  String get foodNoteHint => 'Ví dụ: Không hành, ít cay...';

  @override
  String get foodRequired => '(Bắt buộc)';

  @override
  String get foodAddToCart => 'Thêm vào giỏ';

  @override
  String get trackingOrderStatus => 'Trạng thái đơn hàng';

  @override
  String get trackingStepPending => 'Chờ xác nhận';

  @override
  String get trackingStepPreparing => 'Đang chuẩn bị';

  @override
  String get trackingStepDelivering => 'Đang giao';

  @override
  String get trackingStepDelivered => 'Đã giao';

  @override
  String get trackingOrderInProgress => 'Đơn hàng đang được giao';

  @override
  String get trackingCallDriver => 'Gọi';

  @override
  String get trackingMessageDriver => 'Nhắn tin';

  @override
  String get orderHistoryTitle => 'Đơn hàng của tôi';

  @override
  String orderHistoryTabActive(int count) {
    return 'Đang hoạt động ($count)';
  }

  @override
  String orderHistoryTabCompleted(int count) {
    return 'Hoàn thành ($count)';
  }

  @override
  String orderHistoryTabCancelled(int count) {
    return 'Đã hủy ($count)';
  }

  @override
  String get orderHistoryNoActive => 'Không có đơn hàng đang hoạt động';

  @override
  String get orderHistoryNoCompleted => 'Chưa có đơn hàng hoàn thành';

  @override
  String get orderHistoryNoCancelled => 'Không có đơn hàng đã hủy';

  @override
  String get orderHistoryEmptySubtitle => 'Các đơn hàng sẽ xuất hiện ở đây';

  @override
  String get orderHistoryTrack => 'Theo dõi';

  @override
  String get addressManagementTitle => 'Địa chỉ của tôi';

  @override
  String get addressAdd => 'Thêm địa chỉ';

  @override
  String get addressLoading => 'Đang tải địa chỉ...';

  @override
  String get addressEmpty => 'Chưa có địa chỉ nào';

  @override
  String get addressEmptySubtitle => 'Thêm địa chỉ để bắt đầu đặt hàng';

  @override
  String get addressSetDefault => 'Đặt làm mặc định';

  @override
  String get addressEdit => 'Sửa';

  @override
  String get addressDeleteTitle => 'Xóa địa chỉ?';

  @override
  String addressDeleteContent(String label) {
    return 'Xóa \"$label\"?';
  }

  @override
  String get addressAddSuccess => 'Đã thêm địa chỉ mới';

  @override
  String get addressUpdateSuccess => 'Đã cập nhật địa chỉ';

  @override
  String get addressDeleteSuccess => 'Đã xóa địa chỉ';

  @override
  String get addressSave => 'Lưu';

  @override
  String get addressLabelField => 'Nhãn';

  @override
  String get addressFieldHint => 'Nhập địa chỉ chi tiết';

  @override
  String get supportConnecting => 'Đang kết nối...';

  @override
  String get supportDriverOnline => 'Đang hoạt động';

  @override
  String get supportAiHeader =>
      'Hỗ trợ bởi AI - Trả lời nhanh các câu hỏi thường gặp';

  @override
  String get supportNoMessages => 'Chưa có tin nhắn nào';

  @override
  String get supportNoMessagesSubtitle =>
      'Gửi tin nhắn đầu tiên để bắt đầu trò chuyện';

  @override
  String get supportMessageHint => 'Nhập tin nhắn...';

  @override
  String get reviewTitle => 'Đánh giá đơn hàng';

  @override
  String get reviewFoodQuality => 'Chất lượng món ăn';

  @override
  String get reviewDeliveryQuality => 'Chất lượng giao hàng';

  @override
  String get reviewComment => 'Nhận xét của bạn';

  @override
  String get reviewCommentHint =>
      'Chia sẻ trải nghiệm của bạn về món ăn và dịch vụ giao hàng...';

  @override
  String get reviewSubmit => 'Gửi đánh giá';

  @override
  String get reviewSuccess => 'Đánh giá thành công!';

  @override
  String get reviewError => 'Có lỗi xảy ra. Vui lòng thử lại.';

  @override
  String get reviewRatingExcellent => 'Tuyệt vời!';

  @override
  String get reviewRatingGood => 'Tốt';

  @override
  String get reviewRatingAverage => 'Trung bình';

  @override
  String get reviewRatingPoor => 'Kém';

  @override
  String get reviewRatingBad => 'Rất tệ';

  @override
  String get driverDashboardToday => 'Hôm nay';

  @override
  String get driverDashboardOrders => 'Đơn gần đây';

  @override
  String get driverDashboardNoOrders => 'Chưa có đơn hàng nào';

  @override
  String get driverStatEarnings => 'Thu nhập';

  @override
  String get driverStatOnline => 'Online';

  @override
  String get driverEarningsTitle => 'Thu nhập';

  @override
  String get driverEarningsPeriodToday => 'Hôm nay';

  @override
  String get driverEarningsPeriodWeek => 'Tuần này';

  @override
  String get driverEarningsPeriodMonth => 'Tháng này';

  @override
  String get driverEarningsTotal => 'Tổng thu nhập';

  @override
  String get driverEarningsAverage => 'Trung bình/đơn';

  @override
  String get driverEarningsHistory => 'Lịch sử giao hàng';

  @override
  String get driverEarningsEmpty => 'Chưa có dữ liệu thu nhập';

  @override
  String get driverEarningsChartError => 'Không thể tải biểu đồ thu nhập';

  @override
  String get driverEarningsChartRetry => 'Thử lại';

  @override
  String get driverRatingsTitle => 'Lịch sử đánh giá';

  @override
  String get driverRatingsAll => 'Tất cả';

  @override
  String driverRatingsStars(int count) {
    return '$count sao';
  }

  @override
  String get driverRatingsEmpty => 'Chưa có đánh giá nào';

  @override
  String get driverRatingsError => 'Không thể tải đánh giá lúc này.';

  @override
  String get driverRatingsRetry => 'Thử lại';

  @override
  String driverRatingsOrder(String code) {
    return 'ĐH: $code';
  }

  @override
  String get driverRatingsToday => 'Hôm nay';

  @override
  String get driverRatingsYesterday => 'Hôm qua';

  @override
  String get driverTripDetailTitle => 'Chi tiết chuyến đi';

  @override
  String get driverTripDetailSegments => 'Hướng dẫn từng chặng';

  @override
  String get driverTripDetailRetry => 'Thử lại';

  @override
  String get driverTripDetailNoRoute =>
      'Chưa có dữ liệu lộ trình cho chuyến này';

  @override
  String get driverTripDetailLoadError => 'Không thể tải lộ trình chuyến đi';

  @override
  String driverTripDetailOrder(String code) {
    return 'ĐH: $code';
  }

  @override
  String get driverTripSummaryDistance => 'Khoảng cách';

  @override
  String get driverTripSummaryDuration => 'Thời gian';

  @override
  String get driverTripSummaryAvgSpeed => 'Tốc độ TB';

  @override
  String get driverTripSummaryEarnings => 'Thu nhập';

  @override
  String get driverTripSummaryCustomerRating => 'Đánh giá từ khách';

  @override
  String driverTripSummaryMinutes(int minutes) {
    return '$minutes phút';
  }

  @override
  String get driverKycTitle => 'Xác minh KYC';

  @override
  String get driverKycUploadTitle => 'Tải lên giấy tờ';

  @override
  String get driverKycUploadSubtitle =>
      'Vui lòng tải lên đầy đủ các giấy tờ yêu cầu';

  @override
  String get driverKycCccdFront => 'CCCD mặt trước';

  @override
  String get driverKycCccdBack => 'CCCD mặt sau';

  @override
  String get driverKycDriverLicense => 'Bằng lái xe';

  @override
  String get driverKycVehicleReg => 'Đăng ký xe';

  @override
  String get driverKycTakePhoto => 'Chụp ảnh';

  @override
  String get driverKycGallery => 'Chọn từ thư viện';

  @override
  String get driverKycUploadHint => 'Chụp ảnh hoặc tải lên';

  @override
  String get driverKycSubmit => 'GỬI ĐĂNG KÝ';

  @override
  String get driverKycNote =>
      'Đơn xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.';

  @override
  String get driverHistoryTitle => 'Lịch sử giao hàng';

  @override
  String get driverHistoryFilterDate => 'Lọc theo ngày';

  @override
  String get driverHistoryEmpty => 'Chưa có lịch sử giao hàng';

  @override
  String get driverHistoryDeliveryFee => 'Phí giao hàng';

  @override
  String get locationPermissionTitle => 'Cho phép truy cập vị trí';

  @override
  String get locationPermissionSubtitle =>
      'FoodFlow cần vị trí của bạn để tìm nhà hàng gần nhất và giao hàng chính xác hơn.';

  @override
  String get locationPermissionAllow => 'Cho phép';

  @override
  String get locationPermissionManual => 'Nhập địa chỉ thủ công';

  @override
  String get driverNavTitle => 'Giao hàng';

  @override
  String get driverNavNoOrder => 'Không có đơn hàng đang thực hiện';

  @override
  String get driverNavRestaurant => 'Nhà hàng';

  @override
  String get driverNavCallRestaurant => 'Gọi nhà hàng';

  @override
  String get driverNavDeliveryAddress => 'Địa chỉ giao hàng';

  @override
  String get driverNavArrivedAtRestaurant => 'ĐÃ ĐẾN NHÀ HÀNG';

  @override
  String get driverNavPreparingFood => 'Đang chuẩn bị món';

  @override
  String get driverNavItemsToPickup => 'Món cần lấy';

  @override
  String get driverNavConfirmPickup => 'XÁC NHẬN LẤY HÀNG';

  @override
  String get driverNavEta => 'ETA - Thời gian dự kiến';

  @override
  String get driverNavCustomerAddress => 'Địa chỉ khách hàng';

  @override
  String get driverNavCallCustomer => 'Gọi khách';

  @override
  String get driverNavConfirmDelivery => 'ĐÃ GIAO HÀNG';

  @override
  String get driverNavDeliverySuccess => 'Giao hàng thành công!';

  @override
  String get driverNavOrderTotal => 'Tổng đơn';

  @override
  String get driverNavYouEarned => 'Bạn nhận được';

  @override
  String get driverNavGoHome => 'VỀ TRANG CHỦ';

  @override
  String get driverNavPhoneError => 'Không thể mở trình quay số';

  @override
  String get cartPlaceOrder => 'Đặt hàng';

  @override
  String get checkoutConfirmOrder => 'Xác nhận đặt hàng';

  @override
  String get onboardingSkip => 'Bỏ qua';

  @override
  String get onboardingNext => 'Tiếp theo';

  @override
  String get onboardingGetStarted => 'Bắt đầu ngay';

  @override
  String get onboardingWelcomeTitle => 'Chào mừng đến FoodFlow';

  @override
  String get onboardingWelcomeSubtitle =>
      'Đặt đồ ăn yêu thích, giao tận nơi nhanh chóng';

  @override
  String get onboardingLocationTitle => 'Tìm nhà hàng gần bạn';

  @override
  String get onboardingLocationSubtitle =>
      'Cho phép truy cập vị trí để tìm nhà hàng tốt nhất gần bạn';

  @override
  String get onboardingNotificationTitle => 'Cập nhật đơn hàng real-time';

  @override
  String get onboardingNotificationSubtitle =>
      'Nhận thông báo khi đơn hàng được xác nhận và giao hàng';

  @override
  String get loyaltyTitle => 'Điểm thưởng';

  @override
  String get loyaltyPointsBalance => 'Số điểm hiện có';

  @override
  String loyaltyPoints(int count) {
    return '$count điểm';
  }

  @override
  String get loyaltyTierBronze => 'Đồng';

  @override
  String get loyaltyTierSilver => 'Bạc';

  @override
  String get loyaltyTierGold => 'Vàng';

  @override
  String get loyaltyTierPlatinum => 'Bạch kim';

  @override
  String get loyaltyNextTier => 'Hạng tiếp theo';

  @override
  String loyaltyPointsToNextTier(int points) {
    return 'Cần thêm $points điểm để lên hạng';
  }

  @override
  String get loyaltyHistory => 'Lịch sử điểm';

  @override
  String get loyaltyHistoryEmpty => 'Chưa có lịch sử điểm thưởng';

  @override
  String get loyaltyRedeem => 'Đổi điểm';

  @override
  String get loyaltyEarnPoints => 'Cách kiếm điểm';

  @override
  String get loyaltyEarnOrderDesc => 'Mỗi đơn hàng hoàn thành = 10 điểm';

  @override
  String get loyaltyEarnReferralDesc =>
      'Mỗi lần giới thiệu thành công = 50 điểm';

  @override
  String get walletTitle => 'Ví điện tử';

  @override
  String get walletBalance => 'Số dư';

  @override
  String get walletTopUp => 'Nạp tiền';

  @override
  String get walletWithdraw => 'Rút tiền';

  @override
  String get walletTransactionHistory => 'Lịch sử giao dịch';

  @override
  String get walletTransactionEmpty => 'Chưa có giao dịch nào';

  @override
  String get walletTopUpTitle => 'Nạp tiền vào ví';

  @override
  String get walletSelectAmount => 'Chọn số tiền';

  @override
  String get walletConfirmTopUp => 'Xác nhận nạp tiền';

  @override
  String get walletDebit => 'Chi tiêu';

  @override
  String get walletCredit => 'Nạp tiền';

  @override
  String get referralTitle => 'Giới thiệu bạn bè';

  @override
  String get referralSubtitle => 'Chia sẻ mã giới thiệu và nhận thưởng';

  @override
  String get referralCode => 'Mã giới thiệu của bạn';

  @override
  String get referralCopyCode => 'Sao chép mã';

  @override
  String get referralCodeCopied => 'Đã sao chép mã!';

  @override
  String get referralShareCode => 'Chia sẻ mã';

  @override
  String referralInviteCount(int count) {
    return 'Đã giới thiệu $count người';
  }

  @override
  String get referralBonusEarned => 'Thưởng đã nhận';

  @override
  String get referralHowItWorks => 'Cách thức hoạt động';

  @override
  String get referralStep1 => 'Chia sẻ mã giới thiệu của bạn';

  @override
  String get referralStep2 => 'Bạn bè đăng ký và đặt đơn đầu tiên';

  @override
  String get referralStep3 => 'Cả hai cùng nhận 50 điểm thưởng';

  @override
  String get helpTitle => 'Trung tâm hỗ trợ';

  @override
  String get helpSearchHint => 'Tìm kiếm câu hỏi...';

  @override
  String get helpFaq => 'Câu hỏi thường gặp';

  @override
  String get helpFaqEmpty => 'Không tìm thấy câu hỏi nào';

  @override
  String get helpChatSupport => 'Chat hỗ trợ';

  @override
  String get helpCallSupport => 'Gọi hỗ trợ';

  @override
  String get helpEmailSupport => 'Email hỗ trợ';

  @override
  String get helpCategories => 'Danh mục';

  @override
  String get helpCategoryOrders => 'Đơn hàng';

  @override
  String get helpCategoryPayment => 'Thanh toán';

  @override
  String get helpCategoryDelivery => 'Giao hàng';

  @override
  String get helpCategoryAccount => 'Tài khoản';

  @override
  String get filterTitle => 'Bộ lọc';

  @override
  String get filterApply => 'Áp dụng';

  @override
  String get filterReset => 'Đặt lại';

  @override
  String get filterRating => 'Đánh giá';

  @override
  String get filterDeliveryTime => 'Thời gian giao';

  @override
  String get filterPriceRange => 'Khoảng giá';

  @override
  String filterMinutes(int min) {
    return '$min phút';
  }

  @override
  String get filterFreeDelivery => 'Giao hàng miễn phí';

  @override
  String get filterOpenNow => 'Đang mở cửa';

  @override
  String get addressPickerTitle => 'Chọn địa chỉ';

  @override
  String get addressPickerSearchHint => 'Tìm kiếm địa chỉ...';

  @override
  String get addressPickerUseCurrentLocation => 'Dùng vị trí hiện tại';

  @override
  String get addressPickerSaved => 'Địa chỉ đã lưu';

  @override
  String get addressPickerNoSaved => 'Chưa có địa chỉ đã lưu';

  @override
  String get addressPickerConfirm => 'Xác nhận địa chỉ này';

  @override
  String get driver_onboarding_vehicle_title => 'Thông tin phương tiện';

  @override
  String get driver_onboarding_vehicle_subtitle =>
      'Cho chúng tôi biết về xe của bạn';

  @override
  String get driver_onboarding_vehicle_type_label => 'Loại phương tiện';

  @override
  String get driver_onboarding_vehicle_type_bike => 'Xe đạp';

  @override
  String get driver_onboarding_vehicle_type_motorbike => 'Xe máy';

  @override
  String get driver_onboarding_vehicle_type_car => 'Ô tô';

  @override
  String get driver_onboarding_plate_label => 'Biển số xe';

  @override
  String get driver_onboarding_plate_hint => 'Nhập biển số xe';

  @override
  String get driver_onboarding_plate_required => 'Vui lòng nhập biển số';

  @override
  String get driver_onboarding_next => 'Tiếp theo';

  @override
  String get driver_onboarding_documents_title => 'Giấy tờ cần thiết';

  @override
  String get driver_onboarding_documents_subtitle =>
      'Tải lên đầy đủ giấy tờ để được xét duyệt';

  @override
  String get driver_onboarding_agreement_title => 'Điều khoản tài xế';

  @override
  String get driver_onboarding_agreement_subtitle =>
      'Đọc và đồng ý với điều khoản để tham gia';

  @override
  String get driver_onboarding_agreement_read =>
      'Tôi đã đọc và đồng ý điều khoản dịch vụ';

  @override
  String get driver_onboarding_agreement_accept => 'Đồng ý và tiếp tục';

  @override
  String get driver_onboarding_agreement_submit => 'GỬI ĐĂNG KÝ';

  @override
  String get driver_onboarding_agreement_note =>
      'Hồ sơ xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.';

  @override
  String get driver_incentives_title => 'Ưu đãi';

  @override
  String get driver_incentives_active => 'Đang diễn ra';

  @override
  String get driver_incentives_completed => 'Hoàn thành';

  @override
  String driver_incentives_progress(int current, int target) {
    return '$current/$target đơn';
  }

  @override
  String driver_incentives_reward(String amount) {
    return 'Thưởng: $amount';
  }

  @override
  String get driver_incentives_empty => 'Không có ưu đãi nào';

  @override
  String get driver_incentives_error => 'Không thể tải ưu đãi';

  @override
  String get driver_incentives_retry => 'Thử lại';

  @override
  String driver_incentives_expires(String date) {
    return 'Hết hạn: $date';
  }

  @override
  String get driver_heatmap_title => 'Bản đồ nhu cầu';

  @override
  String get driver_heatmap_subtitle => 'Khu vực đang có nhu cầu giao hàng cao';

  @override
  String get driver_heatmap_high => 'Nhu cầu cao';

  @override
  String get driver_heatmap_medium => 'Nhu cầu trung bình';

  @override
  String get driver_heatmap_low => 'Nhu cầu thấp';

  @override
  String get driver_heatmap_legend => 'Chú giải màu sắc';

  @override
  String get driver_bank_title => 'Tài khoản ngân hàng';

  @override
  String get driver_bank_subtitle =>
      'Thêm tài khoản để nhận thanh toán hàng tuần';

  @override
  String get driver_bank_name_label => 'Tên ngân hàng';

  @override
  String get driver_bank_name_hint => 'Chọn ngân hàng';

  @override
  String get driver_bank_account_label => 'Số tài khoản';

  @override
  String get driver_bank_account_hint => 'Nhập số tài khoản';

  @override
  String get driver_bank_account_required => 'Vui lòng nhập số tài khoản';

  @override
  String get driver_bank_save => 'Lưu tài khoản';

  @override
  String get driver_bank_saved => 'Đã lưu tài khoản ngân hàng';

  @override
  String get driver_bank_verify => 'Xác minh tài khoản';

  @override
  String get driver_bank_add_title => 'Thêm tài khoản';

  @override
  String get driver_bank_name_required => 'Vui lòng chọn ngân hàng';

  @override
  String get driver_bank_holder_label => 'Tên chủ tài khoản';

  @override
  String get driver_bank_holder_hint => 'NGUYEN VAN A';

  @override
  String get driver_bank_holder_required => 'Vui lòng nhập tên chủ tài khoản';

  @override
  String get driver_bank_linked_title => 'Tài khoản đã liên kết';

  @override
  String get driver_bank_default_badge => 'Mặc định';

  @override
  String get driver_bank_add_button => 'Thêm tài khoản ngân hàng';

  @override
  String get driver_bank_save_failed =>
      'Không thể cập nhật tài khoản. Vui lòng thử lại.';

  @override
  String get driver_bank_delete_tooltip => 'Xóa tài khoản ngân hàng';

  @override
  String get driver_bank_delete_title => 'Xóa tài khoản ngân hàng?';

  @override
  String get driver_bank_delete_message =>
      'Tài khoản nhận thanh toán này sẽ bị gỡ khỏi hồ sơ tài xế.';

  @override
  String get driver_bank_delete_confirm => 'Xóa';

  @override
  String get driver_bank_cancel => 'Hủy';

  @override
  String get driver_bank_retry => 'Thử lại';

  @override
  String get driver_support_title => 'Hỗ trợ tài xế';

  @override
  String get driver_support_subtitle => 'Chúng tôi luôn sẵn sàng giúp đỡ bạn';

  @override
  String get driver_support_faq => 'Câu hỏi thường gặp';

  @override
  String get driver_support_contact => 'Liên hệ hỗ trợ';

  @override
  String get driver_support_chat => 'Chat trực tiếp';

  @override
  String get driver_support_email => 'Gửi email';

  @override
  String get driver_support_phone => 'Hotline: 1800-xxxx';

  @override
  String get driver_support_faq_q1 => 'Tôi nhận tiền vào khi nào?';

  @override
  String get driver_support_faq_a1 =>
      'Thu nhập được chuyển vào tài khoản ngân hàng mỗi thứ Hai hàng tuần.';

  @override
  String get driver_support_faq_q2 => 'Làm sao để thay đổi khu vực giao hàng?';

  @override
  String get driver_support_faq_a2 =>
      'Vào Cài đặt > Khu vực hoạt động để thay đổi.';

  @override
  String get driver_settings_title => 'Cài đặt';

  @override
  String get driver_settings_notifications => 'Thông báo đẩy';

  @override
  String get driver_settings_notifications_subtitle =>
      'Nhận thông báo về đơn hàng mới';

  @override
  String get driver_settings_language => 'Ngôn ngữ';

  @override
  String get driver_settings_language_subtitle => 'Tiếng Việt';

  @override
  String get driver_settings_privacy => 'Chính sách bảo mật';

  @override
  String get driver_settings_about => 'Về ứng dụng';

  @override
  String get driver_settings_logout => 'Đăng xuất';

  @override
  String get driver_settings_logout_confirm => 'Bạn có chắc muốn đăng xuất?';

  @override
  String get driver_settings_sound => 'Âm thanh thông báo';

  @override
  String get driver_settings_sound_subtitle =>
      'Phát âm thanh khi có đơn hàng mới';

  @override
  String driver_settings_version(String version) {
    return 'Phiên bản $version';
  }

  @override
  String get favoritesTitle => 'Yêu thích';

  @override
  String get favoritesEmpty => 'Chưa có nhà hàng yêu thích';

  @override
  String get favoritesEmptySubtitle =>
      'Hãy khám phá và thêm vào danh sách yêu thích của bạn';

  @override
  String get favoritesEmptyCta => 'Khám phá nhà hàng';

  @override
  String get searchInputHint => 'Tìm món ăn, nhà hàng...';

  @override
  String get searchButtonLabel => 'Tìm';

  @override
  String get searchRecentLabel => 'Tìm kiếm gần đây';

  @override
  String get searchClearAll => 'Xóa tất cả';

  @override
  String get searchEmptyTitle => 'Tìm kiếm món ăn, nhà hàng';

  @override
  String get searchEmptySubtitle => 'Nhập tên món hoặc nhà hàng bạn muốn tìm';

  @override
  String searchNoResults(String query) {
    return 'Không tìm thấy kết quả cho \"$query\"';
  }

  @override
  String get searchNoResultsSubtitle => 'Thử từ khóa khác hoặc thay đổi bộ lọc';

  @override
  String get searchClosedBadge => 'Đóng cửa';

  @override
  String get searchFilterNearest => 'Gần nhất';

  @override
  String get searchFilterTopRated => 'Đánh giá cao';

  @override
  String get searchFilterPriceLowHigh => 'Giá thấp → cao';

  @override
  String get searchFilterOpenNow => 'Đang mở';

  @override
  String get vouchersTitle => 'Ưu đãi & Voucher';

  @override
  String get vouchersTabMine => 'Của tôi';

  @override
  String get vouchersTabAvailable => 'Khả dụng';

  @override
  String get vouchersTabExpired => 'Hết hạn';

  @override
  String get vouchersCodeCopied => 'Đã sao chép mã';

  @override
  String get vouchersEmptyMine => 'Chưa có voucher';

  @override
  String get vouchersEmptyAvailable => 'Chưa có voucher khả dụng';

  @override
  String get vouchersEmptyAvailableSubtitle =>
      'Khám phá các voucher đang có sẵn';

  @override
  String get vouchersEmptyExpired => 'Không có voucher hết hạn';

  @override
  String get vouchersEmptyExpiredSubtitle =>
      'Voucher hết hạn sẽ xuất hiện ở đây';

  @override
  String get vouchersUseNow => 'Dùng ngay';

  @override
  String vouchersPercentOff(int percent) {
    return 'Giảm $percent%';
  }

  @override
  String vouchersMinOrder(String amount) {
    return 'Đơn tối thiểu $amount';
  }

  @override
  String vouchersExpiresAt(String date) {
    return 'HSD: $date';
  }

  @override
  String get membershipTitle => 'FoodFlow Pro';

  @override
  String get membershipFreeLabel => 'Miễn phí';

  @override
  String get membershipProTier => 'Pro';

  @override
  String get membershipProPlusTier => 'Pro+';

  @override
  String membershipProPrice(String price) {
    return '$price/tháng';
  }

  @override
  String get membershipCurrentBadge => 'Gói hiện tại';

  @override
  String get membershipUpgradeCta => 'Nâng cấp ngay';

  @override
  String get membershipChoosePlan => 'Chọn gói phù hợp với bạn';

  @override
  String get membershipUpgradeBenefit => 'Nâng cấp để nhận thêm đặc quyền';

  @override
  String membershipUpgradedMessage(String tier) {
    return 'Đã nâng cấp lên $tier!';
  }

  @override
  String get membershipUpgradeFailed => 'Không thể nâng cấp';

  @override
  String membershipValidUntil(String date) {
    return 'Có hiệu lực đến $date';
  }

  @override
  String get membershipPerMonth => '/tháng';

  @override
  String get membershipBenefitBasicDelivery => 'Giao hàng cơ bản';

  @override
  String get membershipBenefitBasicPoints => 'Tích điểm thưởng 1%';

  @override
  String get membershipBenefitFreeDelivery =>
      'Miễn phí giao hàng không giới hạn';

  @override
  String get membershipBenefitPriorityDriver => 'Ưu tiên tài xế cao cấp';

  @override
  String get membershipBenefitBonusPoints3 => 'Tích điểm thưởng 3%';

  @override
  String get membershipBenefitVipDriver => 'Ưu tiên tài xế cao cấp nhất';

  @override
  String get membershipBenefitBonusPoints5 => 'Tích điểm thưởng 5%';

  @override
  String get membershipBenefitVoucher100k => 'Voucher sinh nhật 100K₫';

  @override
  String get membershipBenefitVoucher200k => 'Voucher sinh nhật 200K₫';

  @override
  String get membershipBenefitVipSupport => 'Hỗ trợ 24/7 VIP';

  @override
  String get cancelOrderTitle => 'Hủy đơn hàng';

  @override
  String get cancelOrderSuccess => 'Đã hủy đơn hàng thành công';

  @override
  String get cancelOrderFailed => 'Không thể hủy đơn hàng';

  @override
  String get cancelOrderInfoHeader => 'Thông tin đơn hàng';

  @override
  String get cancelOrderReasonHeader => 'Chọn lý do hủy';

  @override
  String get cancelOrderReasonSubtitle =>
      'Chúng tôi rất tiếc nếu có điều gì không như ý';

  @override
  String get cancelOrderReasonSlow => 'Nhà hàng quá lâu';

  @override
  String get cancelOrderReasonChanged => 'Đổi ý';

  @override
  String get cancelOrderReasonWrong => 'Đặt nhầm';

  @override
  String get cancelOrderReasonOther => 'Khác';

  @override
  String get cancelOrderNoteHint => 'Ghi chú thêm (tùy chọn)';

  @override
  String get cancelOrderRefundNote => 'Hoàn tiền trong 3-5 ngày làm việc';

  @override
  String get cancelOrderConfirmCta => 'Xác nhận hủy';

  @override
  String get helpCenterSearchHint => 'Tìm câu hỏi...';

  @override
  String get helpCenterChatCta => 'Chat với hỗ trợ';

  @override
  String get helpCenterNoResults => 'Không tìm thấy câu hỏi phù hợp';

  @override
  String get helpFaqCancelOrderQ => 'Làm thế nào để hủy đơn hàng?';

  @override
  String get helpFaqCancelOrderA =>
      'Bạn có thể hủy đơn hàng trong vòng 2 phút sau khi đặt. Vào \"Đơn hàng\" → chọn đơn → nhấn \"Hủy đơn\".';

  @override
  String get helpFaqLateDeliveryQ => 'Đơn hàng bị trễ phải làm gì?';

  @override
  String get helpFaqLateDeliveryA =>
      'Vui lòng liên hệ chat hỗ trợ để chúng tôi kiểm tra trực tiếp với tài xế.';

  @override
  String get helpFaqPaymentMethodsQ =>
      'Phương thức thanh toán nào được chấp nhận?';

  @override
  String get helpFaqPaymentMethodsA =>
      'Hiện tại chúng tôi chấp nhận tiền mặt khi nhận hàng và ví điện tử FoodFlow.';

  @override
  String get helpFaqTopUpWalletQ => 'Làm thế nào để nạp tiền vào ví?';

  @override
  String get helpFaqTopUpWalletA =>
      'Vào \"Cá nhân\" → \"Ví điện tử\" → nhấn \"Nạp tiền\" và chọn mệnh giá mong muốn.';

  @override
  String get helpFaqAddAddressQ => 'Làm sao để thêm địa chỉ giao hàng?';

  @override
  String get helpFaqAddAddressA =>
      'Vào \"Cá nhân\" → \"Địa chỉ của tôi\" → nhấn \"Thêm địa chỉ\" và nhập thông tin.';

  @override
  String get helpFaqMissingOrderQ =>
      'Tôi không nhận được đơn hàng, phải làm gì?';

  @override
  String get helpFaqMissingOrderA =>
      'Nếu tài xế đã đánh dấu giao thành công nhưng bạn chưa nhận được, hãy liên hệ hỗ trợ ngay.';

  @override
  String get helpFaqRewardPointsQ => 'Điểm thưởng được tích như thế nào?';

  @override
  String get helpFaqRewardPointsA =>
      'Mỗi đơn hàng hoàn thành bạn nhận được 10 điểm. Giới thiệu bạn bè thành công nhận thêm 50 điểm.';

  @override
  String get helpFaqTrackOrderQ => 'Làm sao để theo dõi đơn hàng real-time?';

  @override
  String get helpFaqTrackOrderA =>
      'Sau khi đặt hàng thành công, vào \"Đơn hàng\" → chọn đơn đang hoạt động → nhấn \"Theo dõi\".';
}
