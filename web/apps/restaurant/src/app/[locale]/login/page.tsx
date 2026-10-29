'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';

const DEMO_LABELS = {
  vi: {
    title: 'Tài khoản nhà hàng mẫu (Demo):',
    fill: 'Điền nhanh',
    slowNotice: 'Đang kết nối tới máy chủ (có thể mất vài giây nếu máy chủ đang khởi động)...',
  },
  en: {
    title: 'Demo Restaurant Account:',
    fill: 'Quick fill',
    slowNotice: 'Connecting to server (may take a few seconds on cold start)...',
  },
  ja: {
    title: 'デモ店舗アカウント:',
    fill: 'クイック入力',
    slowNotice: 'サーバーに接続中（初回起動時は少し時間がかかる場合があります）...',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const { login } = useAuth();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isLoading) {
      timer = setTimeout(() => setSlowNotice(true), 2500);
    } else {
      setSlowNotice(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  const activeDemo =
    DEMO_LABELS[locale as 'vi' | 'en' | 'ja'] ?? DEMO_LABELS.vi;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { name: string; email: string; role: string };
      }>('/auth/login', { email, password }, { requireAuth: false });

      if (data.user.role !== 'restaurant') {
        throw new Error(t('restaurantOnly'));
      }

      localStorage.setItem('restaurant_refresh_token', data.refreshToken);
      await login(data.accessToken);

      if (typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
        try {
          const activeLocale = window.location.pathname.match(/^\/(vi|en|ja)(?:\/|$)/)?.[1] ?? locale ?? 'vi';
          window.location.assign(`/${activeLocale}/orders`);
        } catch {
          router.push('/orders');
        }
      } else {
        router.push('/orders');
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <FoodFlowLogo showWordmark={false} markClassName="h-16 w-16" className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">{tCommon('email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={t('emailPlaceholder')}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">{tCommon('password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5"
            >
              {isLoading ? t('loggingIn') : tCommon('login')}
            </button>

            {slowNotice && isLoading && (
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 animate-in fade-in">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{activeDemo.slowNotice}</span>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/70 p-3 text-left">
              <p className="text-xs font-semibold text-orange-950">{activeDemo.title}</p>
              <div className="mt-2">
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded border border-gray-200 bg-white px-2.5 text-xs text-gray-700 hover:bg-orange-50"
                  onClick={() => {
                    setEmail('restaurant1@foodflow.vn');
                    setPassword('Demo@123456');
                  }}
                  disabled={isLoading}
                >
                  <span>Nhà hàng: <strong className="text-gray-900">restaurant1@foodflow.vn</strong></span>
                  <span className="text-[11px] font-semibold text-orange-900">{activeDemo.fill}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
