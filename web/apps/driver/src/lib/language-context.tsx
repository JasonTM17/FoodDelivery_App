'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'vi' | 'en' | 'ja';

export interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'foodflow_driver_locale';

const LOCALE_CYCLE: Record<Locale, Locale> = {
  vi: 'en',
  en: 'ja',
  ja: 'vi',
};

export const LOCALE_META: Record<Locale, { flag: string; label: string; code: string }> = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt', code: 'VI' },
  en: { flag: '🇬🇧', label: 'English', code: 'EN' },
  ja: { flag: '🇯🇵', label: '日本語', code: 'JA' },
};

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    // Nav
    'nav.drive': 'Nhận đơn',
    'nav.history': 'Lịch sử',
    'nav.earnings': 'Thu nhập',
    'nav.profile': 'Tài khoản',
    'nav.login': 'Đăng nhập',
    'nav.logout': 'Đăng xuất',

    // Auth
    'auth.signInTitle': 'Đăng nhập tài xế',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.signInBtn': 'Đăng nhập',
    'auth.signingIn': 'Đang đăng nhập...',
    'auth.wrongCredentials': 'Sai email hoặc mật khẩu.',
    'auth.notDriver': 'Tài khoản này không phải là tài xế.',
    'auth.genericError': 'Không thể đăng nhập. Vui lòng thử lại.',
    'auth.demoTitle': 'Tài khoản tài xế mẫu (Demo):',
    'auth.quickFill': 'Điền nhanh',
    'auth.driver1': 'Tài xế 1 (driver1@foodflow.vn)',

    // Dashboard
    'dash.title': 'Bảng điều khiển tài xế',
    'dash.online': 'Trực tuyến',
    'dash.offline': 'Ngoại tuyến',
    'dash.goOnline': 'Bật trực tuyến',
    'dash.goOffline': 'Tắt trực tuyến',
    'dash.waiting': 'Đang chờ đơn hàng mới gần bạn...',
    'dash.offlineDesc': 'Bật trực tuyến để nhận đơn',
    'dash.onlineDesc': 'Sẵn sàng nhận cuốc xe',
    'dash.reconnecting': 'Đang kết nối lại hệ thống nhận đơn.',
    'dash.youAreOffline': 'Bạn đang ngoại tuyến',
    'dash.clickToGoOnline': 'Nhấp vào đây hoặc nút trên để bật trực tuyến và nhận đơn hàng',
    'dash.operatingArea': 'Khu vực hoạt động: Quận 1, TP. HCM',
    'dash.newOffers': 'Đơn hàng mới',
    'dash.activeTrip': 'Cuốc xe hiện tại',
    'dash.accept': 'Nhận cuốc xe',
    'dash.reject': 'Từ chối',
    'dash.pickupAt': 'Lấy hàng tại:',
    'dash.deliverTo': 'Giao hàng đến:',
    'dash.arrivedRestaurant': 'Đã đến quán',
    'dash.pickedUp': 'Đã lấy món',
    'dash.completed': 'Xác nhận đã giao',
    'dash.fee': 'Cước phí:',
    'dash.distance': 'Khoảng cách:',

    // Earnings
    'earnings.title': 'Thu nhập của bạn',
    'earnings.today': 'Hôm nay',
    'earnings.week': 'Tuần này',
    'earnings.total': 'Tổng thu nhập',
    'earnings.trips': 'chuyến hoàn thành',

    // History
    'history.title': 'Lịch sử cuốc xe',
    'history.empty': 'Chưa có cuốc xe nào hoàn thành.',
    'history.tripId': 'Chuyến #{id}',

    // Profile
    'profile.title': 'Hồ sơ tài xế',
    'profile.vehicle': 'Phương tiện',
    'profile.plate': 'Biển số xe',
    'profile.rating': 'Đánh giá',
    'profile.license': 'Giấy phép lái xe',
    'profile.logout': 'Đăng xuất',

    // Common
    'common.loading': 'Đang tải...',
    'common.retry': 'Thử lại',
    'common.error': 'Có lỗi xảy ra',
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
    'dash.offlineDesc': 'Go online to receive offers',
    'dash.onlineDesc': 'Ready to receive offers',
    'dash.reconnecting': 'Reconnecting to offers.',
    'dash.youAreOffline': 'You are offline',
    'dash.clickToGoOnline': 'Click here or the button above to go online and receive offers',
    'dash.operatingArea': 'Operating area: District 1, HCMC',
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
  ja: {
    // Nav
    'nav.drive': '稼働',
    'nav.history': '履歴',
    'nav.earnings': '売上',
    'nav.profile': 'マイページ',
    'nav.login': 'ログイン',
    'nav.logout': 'ログアウト',

    // Auth
    'auth.signInTitle': 'ドライバーログイン',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.signInBtn': 'ログイン',
    'auth.signingIn': 'ログイン中...',
    'auth.wrongCredentials': 'メールアドレスまたはパスワードが正しくありません。',
    'auth.notDriver': 'このアカウントはドライバーアカウントではありません。',
    'auth.genericError': 'ログインに失敗しました。もう一度お試しください。',
    'auth.demoTitle': 'デモ体験ドライバー:',
    'auth.quickFill': 'クイック入力',
    'auth.driver1': 'ドライバー 1 (driver1@foodflow.vn)',

    // Dashboard
    'dash.title': 'ドライバー管理画面',
    'dash.online': 'オンライン',
    'dash.offline': 'オフライン',
    'dash.goOnline': 'オンラインにする',
    'dash.goOffline': 'オフラインにする',
    'dash.waiting': '近くの新しい配達リクエストを待機中...',
    'dash.offlineDesc': '配達を受け取るにはオンラインにしてください',
    'dash.onlineDesc': 'リクエスト待機中',
    'dash.reconnecting': '再接続中...',
    'dash.youAreOffline': 'オフラインです',
    'dash.clickToGoOnline': 'ここをタップしてオンラインにし、配達リクエストを受信します',
    'dash.operatingArea': '稼働エリア: 1区, ホーチミン市',
    'dash.newOffers': '新しい配達オファー',
    'dash.activeTrip': '現在の配達',
    'dash.accept': 'オファーを受ける',
    'dash.reject': '辞退',
    'dash.pickupAt': '集荷先:',
    'dash.deliverTo': 'お届け先:',
    'dash.arrivedRestaurant': '店舗に到着',
    'dash.pickedUp': '商品受け取り完了',
    'dash.completed': '配達完了を確認',
    'dash.fee': '報酬:',
    'dash.distance': '距離:',

    // Earnings
    'earnings.title': '売上管理',
    'earnings.today': '本日',
    'earnings.week': '今週',
    'earnings.total': '総売上',
    'earnings.trips': '件完了',

    // History
    'history.title': '配達履歴',
    'history.empty': '完了した配達はまだありません。',
    'history.tripId': '配達 #{id}',

    // Profile
    'profile.title': 'ドライバー情報',
    'profile.vehicle': '車両',
    'profile.plate': 'ナンバープレート',
    'profile.rating': '評価',
    'profile.license': '運転免許証',
    'profile.logout': 'ログアウト',

    // Common
    'common.loading': '読み込み中...',
    'common.retry': '再試行',
    'common.error': 'エラーが発生しました',
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
      if (saved === 'en' || saved === 'vi' || saved === 'ja') {
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
      const next = LOCALE_CYCLE[prev] ?? 'vi';
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
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-full border border-slate-300 bg-white/95 p-0.5 shadow-xs ${className ?? ''}`}>
      {(['vi', 'en', 'ja'] as const).map((code) => {
        const active = locale === code;
        const meta = LOCALE_META[code];
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-label={`Switch to ${meta.label}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
              active
                ? 'bg-orange-500 text-white shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs leading-none">{meta.flag}</span>
            <span className="text-[11px]">{meta.code}</span>
          </button>
        );
      })}
    </div>
  );
}
