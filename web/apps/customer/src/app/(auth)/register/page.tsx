'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@foodflow/ui';
import { api, ApiClientError, clearToken } from '@/lib/api';
import { CUSTOMER_ROLE, useAuth } from '@/lib/auth-provider';
import { sanitizeNextPath } from '@/lib/redirects';
import type { AuthResult } from '@/lib/types';

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeLogin } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = sanitizeNextPath(params.get('next'));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError('Password needs an uppercase letter, a lowercase letter, and a number.');
      return;
    }
    setBusy(true);
    try {
      // Registration always creates a customer account per the backend contract.
      const result = await api.post<AuthResult>('/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      if (result.user?.role !== CUSTOMER_ROLE) {
        clearToken();
        setError('This account cannot be used here.');
        return;
      }
      await completeLogin(result);
      router.replace(next);
    } catch (err) {
      const apiError = err as ApiClientError;
      setError(apiError?.detail || 'Could not create the account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-bold text-gray-900">Create account</h1>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="label">Full name</span>
          <Input
            autoComplete="name"
            required
            maxLength={100}
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">Phone</span>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="Optional"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">Password</span>
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
          <span id="password-hint" className="mt-1 block text-xs text-muted-foreground">
            8+ characters with uppercase, lowercase, and a number
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary hover:underline"
        >
          Sign in
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
