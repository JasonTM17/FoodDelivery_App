'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost } from '@/lib/api';

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') ?? '';
  }, []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(token ? '' : t('missingToken'));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError(t('missingToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await apiPost('/auth/reset-password', { token, password });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <FoodFlowLogo showWordmark={false} markClassName="h-16 w-16" className="mx-auto mb-3 justify-center" />
          <CardTitle className="text-2xl font-bold">{submitted ? t('successTitle') : t('title')}</CardTitle>
          <CardDescription>{submitted ? t('successDescription') : t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800">
                <ShieldCheck className="mx-auto mb-3 h-10 w-10" aria-hidden="true" />
                <p className="text-sm">{t('successNotice')}</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">{t('backToLogin')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading || !token}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('confirmPlaceholder')}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={loading || !token}
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('backToLogin')}
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
