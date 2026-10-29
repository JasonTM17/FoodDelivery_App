'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'vi' | 'en';

export interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'foodflow_locale';

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    // Nav
    'nav.discover': 'Khám phá',
    'nav.orders': 'Đơn hàng',
    'nav.cart': 'Giỏ hàng',
    'nav.account': 'Tài khoản',
    'nav.login': 'Đăng nhập',
    'nav.logout': 'Đăng xuất',
    'nav.home': 'Trang chủ',

    // Auth
    'auth.signInTitle': 'Đăng nhập',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.signInBtn': 'Đăng nhập',
    'auth.signingIn': 'Đang đăng nhập...',
    'auth.noAccount': 'Chưa có tài khoản?',
    'auth.createOne': 'Đăng ký ngay',
    'auth.demoTitle': 'Tài khoản trải nghiệm mẫu (Demo):',
    'auth.quickFill': 'Điền nhanh',
    'auth.customer1': 'Khách hàng 1 (customer1@foodflow.vn)',
    'auth.customer2': 'Khách hàng 2 (customer2@foodflow.vn)',
    'auth.wrongCredentials': 'Sai email hoặc mật khẩu.',
    'auth.notCustomer': 'Tài khoản này không phải là khách hàng.',
    'auth.genericError': 'Không thể đăng nhập. Vui lòng thử lại.',
    'auth.signUpTitle': 'Tạo tài khoản',
    'auth.fullName': 'Họ và tên',
    'auth.phone': 'Số điện thoại',
    'auth.phoneOptional': 'Không bắt buộc',
    'auth.signUpBtn': 'Tạo tài khoản',
    'auth.signingUp': 'Đang đăng ký...',
    'auth.hasAccount': 'Đã có tài khoản?',
    'auth.passwordHint': 'Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.',
    'auth.passwordTooShort': 'Mật khẩu phải có ít nhất 8 ký tự.',
    'auth.passwordComplexity': 'Mật khẩu cần chữ hoa, chữ thường và chữ số.',

    // Home
    'home.searchPlaceholder': 'Tìm kiếm nhà hàng hoặc món ăn...',
    'home.searchBtn': 'Tìm kiếm',
    'home.useLocation': 'Dùng vị trí hiện tại',
    'home.requestingLocation': 'Đang lấy vị trí...',
    'home.locationDenied': 'Không có quyền truy cập vị trí',
    'home.locationUnsupported': 'Trình duyệt không hỗ trợ định vị',
    'home.allCuisines': 'Tất cả món',
    'home.emptyTitle': 'Không tìm thấy nhà hàng nào',
    'home.emptyDesc': 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.',
    'home.clearFilters': 'Xóa bộ lọc',
    'home.pageOf': 'Trang {page} / {totalPages}',
    'home.prev': 'Trước',
    'home.next': 'Tiếp theo',
    'home.rating': 'đánh giá',
    'home.mins': 'phút',
    'home.distKm': 'km',
    'home.open': 'Đang mở cửa',
    'home.closed': 'Tạm đóng cửa',

    // Cuisines
    'cuisine.Vietnamese': 'Món Việt',
    'cuisine.Japanese': 'Món Nhật',
    'cuisine.Italian': 'Món Ý',
    'cuisine.Fast Food': 'Thức ăn nhanh',

    // Restaurant Detail
    'restaurant.back': 'Quay lại',
    'restaurant.menu': 'Thực đơn món ăn',
    'restaurant.reviews': 'Đánh giá',
    'restaurant.addToCart': 'Thêm vào giỏ',
    'restaurant.added': 'Đã thêm vào giỏ hàng!',
    'restaurant.emptyMenu': 'Nhà hàng này chưa cập nhật món ăn.',
    'restaurant.prepTime': 'Thời gian chuẩn bị ~{mins} phút',
    'restaurant.dialogQty': 'Số lượng',
    'restaurant.dialogAdd': 'Thêm vào giỏ — {price}',
    'restaurant.dialogSpecialInstructions': 'Ghi chú đặc biệt (tùy chọn)',

    // Cart
    'cart.title': 'Giỏ hàng của bạn',
    'cart.empty': 'Giỏ hàng đang trống',
    'cart.browse': 'Khám phá nhà hàng',
    'cart.clear': 'Xóa tất cả',
    'cart.from': 'Từ quán',
    'cart.subtotal': 'Tạm tính',
    'cart.deliveryFee': 'Phí giao hàng',
    'cart.discount': 'Giảm giá',
    'cart.total': 'Tổng thanh toán',
    'cart.checkoutBtn': 'Tiến hành đặt hàng',
    'cart.promoPlaceholder': 'Nhập mã giảm giá...',
    'cart.applyPromo': 'Áp dụng',
    'cart.removePromo': 'Gỡ mã',

    // Checkout
    'checkout.title': 'Thanh toán & Đặt đơn',
    'checkout.addressTitle': 'Địa chỉ nhận hàng',
    'checkout.addAddress': 'Thêm địa chỉ mới',
    'checkout.noAddress': 'Bạn chưa có địa chỉ nhận hàng.',
    'checkout.paymentMethod': 'Phương thức thanh toán',
    'checkout.cash': 'Tiền mặt khi nhận hàng (COD)',
    'checkout.wallet': 'Ví điện tử FoodFlow',
    'checkout.sepay': 'Chuyển khoản SePay (VietQR)',
    'checkout.notes': 'Ghi chú cho nhà hàng / tài xế',
    'checkout.notesPlaceholder': 'Ví dụ: Bấm chuông cổng, giao tận tay...',
    'checkout.placeOrder': 'Xác nhận đặt hàng',
    'checkout.submitting': 'Đang xử lý đơn hàng...',
    'checkout.minOrder': 'Đơn hàng chưa đạt mức tối thiểu.',
    'checkout.walletInsufficient': 'Số dư ví không đủ. Vui lòng nạp thêm hoặc chọn COD.',

    // Success
    'success.title': 'Đặt hàng thành công!',
    'success.desc': 'Đơn hàng của bạn đã được chuyển tới nhà hàng để chuẩn bị.',
    'success.orderId': 'Mã đơn hàng:',
    'success.viewOrder': 'Xem chi tiết & Theo dõi',
    'success.backHome': 'Tiếp tục đặt món',

    // Orders
    'orders.title': 'Đơn hàng của bạn',
    'orders.active': 'Đang xử lý',
    'orders.history': 'Lịch sử',
    'orders.emptyActive': 'Không có đơn hàng nào đang hoạt động.',
    'orders.emptyHistory': 'Bạn chưa có lịch sử đơn hàng nào.',
    'orders.viewDetails': 'Xem chi tiết',
    'orders.orderNum': 'Đơn #{id}',
    'orders.items': '{count} món',

    // Order detail
    'orderDetail.title': 'Chi tiết đơn hàng #{id}',
    'orderDetail.tracking': 'Theo dõi đơn hàng',
    'orderDetail.status': 'Trạng thái:',
    'orderDetail.driver': 'Tài xế:',
    'orderDetail.driverUnassigned': 'Đang tìm tài xế gần bạn...',
    'orderDetail.cancelBtn': 'Hủy đơn hàng',
    'orderDetail.cancelling': 'Đang hủy...',
    'orderDetail.cancelConfirm': 'Bạn có chắc chắn muốn hủy đơn hàng này?',
    'orderDetail.confirmReceipt': 'Đã nhận được hàng',
    'orderDetail.itemsList': 'Danh sách món',

    // Profile & Address
    'profile.title': 'Thông tin tài khoản',
    'profile.addresses': 'Sổ địa chỉ nhận hàng',
    'profile.saveBtn': 'Lưu thay đổi',
    'profile.saving': 'Đang lưu...',
    'profile.saved': 'Cập nhật thành công!',
    'profile.logout': 'Đăng xuất khỏi thiết bị',

    // Common
    'common.loading': 'Đang tải...',
    'common.retry': 'Thử lại',
    'common.error': 'Đã xảy ra lỗi',
  },
  en: {
    // Nav
    'nav.discover': 'Discover',
    'nav.orders': 'Orders',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',
    'nav.home': 'Home',

    // Auth
    'auth.signInTitle': 'Sign in',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signInBtn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.noAccount': 'No account?',
    'auth.createOne': 'Create one',
    'auth.demoTitle': 'Demo Experience Accounts:',
    'auth.quickFill': 'Quick Fill',
    'auth.customer1': 'Customer 1 (customer1@foodflow.vn)',
    'auth.customer2': 'Customer 2 (customer2@foodflow.vn)',
    'auth.wrongCredentials': 'Wrong email or password.',
    'auth.notCustomer': 'This account is not a customer account.',
    'auth.genericError': 'Could not sign in. Try again.',
    'auth.signUpTitle': 'Create account',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone',
    'auth.phoneOptional': 'Optional',
    'auth.signUpBtn': 'Create account',
    'auth.signingUp': 'Creating account...',
    'auth.hasAccount': 'Already have an account?',
    'auth.passwordHint': 'At least 8 characters, including upper, lower and numbers.',
    'auth.passwordTooShort': 'Password must be at least 8 characters.',
    'auth.passwordComplexity': 'Password needs uppercase, lowercase and a number.',

    // Home
    'home.searchPlaceholder': 'Search restaurants or dishes...',
    'home.searchBtn': 'Search',
    'home.useLocation': 'Use current location',
    'home.requestingLocation': 'Getting location...',
    'home.locationDenied': 'Location access denied',
    'home.locationUnsupported': 'Geolocation unsupported',
    'home.allCuisines': 'All Cuisines',
    'home.emptyTitle': 'No restaurants found',
    'home.emptyDesc': 'Try another query or clear filters to see more.',
    'home.clearFilters': 'Clear filters',
    'home.pageOf': 'Page {page} of {totalPages}',
    'home.prev': 'Previous',
    'home.next': 'Next',
    'home.rating': 'reviews',
    'home.mins': 'mins',
    'home.distKm': 'km',
    'home.open': 'Open',
    'home.closed': 'Closed',

    // Cuisines
    'cuisine.Vietnamese': 'Vietnamese',
    'cuisine.Japanese': 'Japanese',
    'cuisine.Italian': 'Italian',
    'cuisine.Fast Food': 'Fast Food',

    // Restaurant Detail
    'restaurant.back': 'Back',
    'restaurant.menu': 'Menu',
    'restaurant.reviews': 'Reviews',
    'restaurant.addToCart': 'Add to cart',
    'restaurant.added': 'Added to cart!',
    'restaurant.emptyMenu': 'This restaurant has not published a menu yet.',
    'restaurant.prepTime': 'Prep time ~{mins} mins',
    'restaurant.dialogQty': 'Quantity',
    'restaurant.dialogAdd': 'Add to cart — {price}',
    'restaurant.dialogSpecialInstructions': 'Special instructions (optional)',

    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.browse': 'Browse restaurants',
    'cart.clear': 'Clear',
    'cart.from': 'From',
    'cart.subtotal': 'Subtotal',
    'cart.deliveryFee': 'Delivery fee',
    'cart.discount': 'Discount',
    'cart.total': 'Total',
    'cart.checkoutBtn': 'Proceed to checkout',
    'cart.promoPlaceholder': 'Promo code...',
    'cart.applyPromo': 'Apply',
    'cart.removePromo': 'Remove',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.addressTitle': 'Delivery address',
    'checkout.addAddress': 'Add new address',
    'checkout.noAddress': 'You have no saved addresses.',
    'checkout.paymentMethod': 'Payment method',
    'checkout.cash': 'Cash on delivery',
    'checkout.wallet': 'FoodFlow wallet',
    'checkout.sepay': 'Bank transfer (SePay)',
    'checkout.notes': 'Delivery notes',
    'checkout.notesPlaceholder': 'e.g. Ring the doorbell...',
    'checkout.placeOrder': 'Place order',
    'checkout.submitting': 'Placing order...',
    'checkout.minOrder': 'Minimum order amount not met.',
    'checkout.walletInsufficient': 'Insufficient wallet balance.',

    // Success
    'success.title': 'Order placed!',
    'success.desc': 'Your order has been sent to the restaurant for preparation.',
    'success.orderId': 'Order ID:',
    'success.viewOrder': 'View & Track Order',
    'success.backHome': 'Keep browsing',

    // Orders
    'orders.title': 'Your Orders',
    'orders.active': 'Active',
    'orders.history': 'History',
    'orders.emptyActive': 'No active orders.',
    'orders.emptyHistory': 'No past orders yet.',
    'orders.viewDetails': 'View details',
    'orders.orderNum': 'Order #{id}',
    'orders.items': '{count} items',

    // Order detail
    'orderDetail.title': 'Order #{id}',
    'orderDetail.tracking': 'Order tracking',
    'orderDetail.status': 'Status:',
    'orderDetail.driver': 'Driver:',
    'orderDetail.driverUnassigned': 'Assigning a driver...',
    'orderDetail.cancelBtn': 'Cancel order',
    'orderDetail.cancelling': 'Cancelling...',
    'orderDetail.cancelConfirm': 'Are you sure you want to cancel this order?',
    'orderDetail.confirmReceipt': 'Confirm receipt',
    'orderDetail.itemsList': 'Order items',

    // Profile & Address
    'profile.title': 'Account',
    'profile.addresses': 'Saved addresses',
    'profile.saveBtn': 'Save changes',
    'profile.saving': 'Saving...',
    'profile.saved': 'Profile updated!',
    'profile.logout': 'Sign out',

    // Common
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.error': 'An error occurred',
  },
};

function resolveT(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let str = translations[locale]?.[key] ?? translations.vi[key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'vi',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (k, params) => resolveT('vi', k, params),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'vi') {
        setLocaleState(saved);
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      // Ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi';
      try {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let str = translations[locale]?.[key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label="Switch language / Đổi ngôn ngữ"
      className={`inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-orange-50 hover:text-orange-950 ${className ?? ''}`}
      title={locale === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
    >
      <span className="text-sm leading-none">{locale === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
      <span className="tracking-tight">{locale === 'vi' ? 'Tiếng Việt' : 'English'}</span>
    </button>
  );
}
