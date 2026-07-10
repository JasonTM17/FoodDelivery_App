'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api, setToken, setStoredRestaurant } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { name: string; email: string; role: string };
        restaurant?: unknown;
      }>('/auth/login', { email, password }, { requireAuth: false });

      if (data.user.role !== 'restaurant') {
        throw new Error(t('restaurantOnly'));
      }

      setToken(data.accessToken);
      localStorage.setItem('restaurant_refresh_token', data.refreshToken);
      if (data.restaurant) setStoredRestaurant(data.restaurant);
      router.push('/orders');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          </form>
        </div>
      </div>
    </div>
  );
}
