'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@foodflow/ui';
import { api, ApiClientError, clearToken } from '@/lib/api';
import { CUSTOMER_ROLE, useAuth } from '@/lib/auth-provider';
import { useLanguage } from '@/lib/language-context';
import { sanitizeNextPath } from '@/lib/redirects';
import type { AuthResult } from '@/lib/types';

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeLogin } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = sanitizeNextPath(params.get('next'));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError(t('auth.passwordComplexity'));
      return;
    }
    setBusy(true);
    try {
      const result = await api.post<AuthResult>('/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      if (result.user?.role !== CUSTOMER_ROLE) {
        clearToken();
        setError(t('auth.notCustomer'));
        return;
      }
      await completeLogin(result);
      router.replace(next);
    } catch (err) {
      const apiError = err as ApiClientError;
      setError(apiError?.detail || t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-bold text-gray-900">{t('auth.signUpTitle')}</h1>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="label">{t('auth.fullName')}</span>
          <Input
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">{t('auth.email')}</span>
          <Input
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">{t('auth.phone')}</span>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder={t('auth.phoneOptional')}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">{t('auth.password')}</span>
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-describedby="password-hint"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </label>
        <p id="password-hint" className="text-xs text-muted-foreground">
          {t('auth.passwordHint')}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t('auth.signingUp') : t('auth.signUpBtn')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary hover:underline"
        >
          {t('auth.signInBtn')}
        </Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}
