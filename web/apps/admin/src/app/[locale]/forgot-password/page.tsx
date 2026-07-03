'use client';

import { FormEvent, useState } from 'react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, MailCheck, XCircle } from 'lucide-react';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost } from '@/lib/api';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword');
  const tCommon = useTranslations('common');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiPost('/auth/forgot-password', { email: email.trim() });
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
                <MailCheck className="mx-auto mb-3 h-10 w-10" aria-hidden="true" />
                <p className="text-sm">{t('neutralNotice')}</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">{t('backToLogin')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{tCommon('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
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
