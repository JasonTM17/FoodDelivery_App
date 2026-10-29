'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Loader2, AlertTriangle, XCircle, Info } from 'lucide-react';

const MAX_FAIL = 5;

const DEMO_LABELS = {
  vi: {
    title: 'Tài khoản quản trị mẫu (Demo):',
    fill: 'Điền nhanh',
    slowNotice: 'Đang kết nối tới máy chủ (có thể mất vài giây nếu máy chủ đang khởi động)...',
  },
  en: {
    title: 'Demo Admin Account:',
    fill: 'Quick fill',
    slowNotice: 'Connecting to server (may take a few seconds on cold start)...',
  },
  ja: {
    title: 'デモ管理者アカウント:',
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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (loading) {
      timer = setTimeout(() => setSlowNotice(true), 2500);
    } else {
      setSlowNotice(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const activeDemo =
    DEMO_LABELS[locale as 'vi' | 'en' | 'ja'] ?? DEMO_LABELS.vi;

  const isLocked = failCount >= MAX_FAIL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setLoading(true);

    try {
      const res = await apiPost<{
        accessToken: string;
        refreshToken: string;
        user: { name?: string; fullName?: string; email: string; role: string };
      }>('/auth/login', { email, password }, { requireAuth: false });

      if (res.user.role !== 'admin') {
        throw new Error(t('adminOnly'));
      }

      localStorage.setItem('admin_token', res.accessToken);
      localStorage.setItem('admin_refresh_token', res.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      if (rememberMe) localStorage.setItem('admin_remember_email', email);
      login(res.accessToken, {
        name: res.user.fullName ?? res.user.name ?? res.user.email,
        email: res.user.email,
        role: res.user.role,
      });

      // Bypasses any client-side router locks and guarantees instant navigation
      if (typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
        try {
          const activeLocale = window.location.pathname.match(/^\/(vi|en|ja)(?:\/|$)/)?.[1] ?? locale ?? 'vi';
          window.location.assign(`/${activeLocale}/overview`);
        } catch {
          router.replace('/overview');
        }
      } else {
        router.replace('/overview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('generic'));
      setFailCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <FoodFlowLogo showWordmark={false} markClassName="h-16 w-16" className="mx-auto mb-4 justify-center" />
          <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLocked && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t('lockMessage', { count: MAX_FAIL })}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isLocked}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{tCommon('password')}</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isLocked}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={loading || isLocked}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                {t('rememberMe')}
              </Label>
            </div>

            {error && !isLocked && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || isLocked}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loggingIn')}
                </>
              ) : isLocked ? (
                t('accountLocked')
              ) : (
                tCommon('login')
              )}
            </Button>

            {slowNotice && loading && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-xs text-blue-700 animate-in fade-in">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{activeDemo.slowNotice}</span>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/70 p-3">
              <p className="text-xs font-semibold text-orange-950">{activeDemo.title}</p>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full justify-between bg-white text-xs text-gray-700 hover:bg-orange-100"
                  onClick={() => {
                    setEmail('admin@foodflow.vn');
                    setPassword('Demo@123456');
                  }}
                >
                  <span>Admin: <strong className="text-gray-900">admin@foodflow.vn</strong></span>
                  <span className="text-[11px] font-semibold text-orange-600">{activeDemo.fill}</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
