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

const STORAGE_KEY = 'foodflow_driver_locale';

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    // Nav
    'nav.drive': 'Nhận đơn',
    'nav.history': 'Chuyến đi',
    'nav.earnings': 'Thu nhập',
    'nav.profile': 'Tài khoản',
    'nav.login': 'Đăng nhập',
    'nav.logout': 'Đăng xuất',

    // Auth
    'auth.signInTitle': 'Đăng nhập Tài xế',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.signInBtn': 'Đăng nhập',
    'auth.signingIn': 'Đang đăng nhập...',
    'auth.wrongCredentials': 'Sai email hoặc mật khẩu.',
    'auth.notDriver': 'Tài khoản này không phải là tài xế FoodFlow.',
    'auth.genericError': 'Không thể đăng nhập. Vui lòng thử lại.',
    'auth.demoTitle': 'Tài khoản tài xế mẫu (Demo):',
    'auth.quickFill': 'Điền nhanh',
    'auth.driver1': 'Tài xế 1 (driver1@foodflow.vn)',

    // Dashboard
    'dash.title': 'Bảng điều khiển tài xế',
    'dash.online': 'Đang trực tuyến',
    'dash.offline': 'Đang nghỉ ngơi',
    'dash.goOnline': 'Bật nhận đơn',
    'dash.goOffline': 'Tắt nhận đơn',
    'dash.waiting': 'Đang chờ đơn hàng mới xung quanh bạn...',
    'dash.newOffers': 'Đơn hàng mới',
    'dash.activeTrip': 'Chuyến đi hiện tại',
    'dash.accept': 'Nhận đơn ngay',
    'dash.reject': 'Bỏ qua',
    'dash.pickupAt': 'Lấy hàng tại:',
    'dash.deliverTo': 'Giao hàng đến:',
    'dash.arrivedRestaurant': 'Đã đến nhà hàng',
    'dash.pickedUp': 'Đã lấy món, bắt đầu giao',
    'dash.completed': 'Xác nhận giao hàng thành công',
    'dash.fee': 'Cước phí:',
    'dash.distance': 'Khoảng cách:',

    // Earnings
    'earnings.title': 'Thu nhập của bạn',
    'earnings.today': 'Hôm nay',
    'earnings.week': 'Tuần này',
    'earnings.total': 'Tổng thu nhập',
    'earnings.trips': 'chuyến hoàn thành',

    // History
    'history.title': 'Lịch sử chuyến đi',
    'history.empty': 'Bạn chưa có chuyến đi nào hoàn thành.',
    'history.tripId': 'Mã chuyến #{id}',

    // Profile
    'profile.title': 'Hồ sơ tài xế',
    'profile.vehicle': 'Phương tiện di chuyển',
    'profile.plate': 'Biển số xe',
    'profile.rating': 'Đánh giá',
    'profile.license': 'Giấy phép lái xe',
    'profile.logout': 'Đăng xuất',

    // Common
    'common.loading': 'Đang tải...',
    'common.retry': 'Thử lại',
    'common.error': 'Đã xảy ra lỗi',
  },
  en: {
    // Nav
    'nav.drive': 'Drive',
    'nav.history': 'Trips',
    'nav.earnings': 'Earnings',
    'nav.profile': 'Account',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',

    // Auth
    'auth.signInTitle': 'Driver sign in',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signInBtn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.wrongCredentials': 'Wrong email or password.',
    'auth.notDriver': 'This account is not a driver account.',
    'auth.genericError': 'Could not sign in. Try again.',
    'auth.demoTitle': 'Demo Experience Driver:',
    'auth.quickFill': 'Quick Fill',
    'auth.driver1': 'Driver 1 (driver1@foodflow.vn)',

    // Dashboard
    'dash.title': 'Driver dashboard',
    'dash.online': 'Online',
    'dash.offline': 'Offline',
    'dash.goOnline': 'Go online',
    'dash.goOffline': 'Go offline',
    'dash.waiting': 'Waiting for new offers nearby...',
    'dash.newOffers': 'New offers',
    'dash.activeTrip': 'Active trip',
    'dash.accept': 'Accept offer',
    'dash.reject': 'Decline',
    'dash.pickupAt': 'Pick up at:',
    'dash.deliverTo': 'Deliver to:',
    'dash.arrivedRestaurant': 'Arrived at restaurant',
    'dash.pickedUp': 'Picked up',
    'dash.completed': 'Confirm delivery',
    'dash.fee': 'Earnings:',
    'dash.distance': 'Distance:',

    // Earnings
    'earnings.title': 'Your earnings',
    'earnings.today': 'Today',
    'earnings.week': 'This week',
    'earnings.total': 'Total earnings',
    'earnings.trips': 'completed trips',

    // History
    'history.title': 'Trip history',
    'history.empty': 'No trips completed yet.',
    'history.tripId': 'Trip #{id}',

    // Profile
    'profile.title': 'Driver profile',
    'profile.vehicle': 'Vehicle',
    'profile.plate': 'License plate',
    'profile.rating': 'Rating',
    'profile.license': 'Driver license',
    'profile.logout': 'Sign out',

    // Common
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.error': 'An error occurred',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  locale: 'vi',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (k) => k,
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
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-slate-100 hover:text-slate-950 ${className ?? ''}`}
      title={locale === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
    >
      <span className="text-sm leading-none">{locale === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
      <span className="tracking-tight">{locale === 'vi' ? 'Tiếng Việt' : 'English'}</span>
    </button>
  );
}
