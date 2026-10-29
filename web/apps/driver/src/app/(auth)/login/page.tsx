'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@foodflow/ui';
import { api, ApiClientError, clearToken } from '@/lib/api';
import { DRIVER_ROLE, useAuth } from '@/lib/auth-provider';
import { sanitizeNextPath } from '@/lib/redirects';
import type { AuthResult } from '@/lib/types';

const DEMO_PASSWORD = 'Demo@123456';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = sanitizeNextPath(params.get('next'), '/dashboard');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await api.post<AuthResult>('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      if (result.user?.role !== DRIVER_ROLE) {
        clearToken();
        setError('This account is not a driver account.');
        return;
      }
      await completeLogin(result);
      router.replace(next);
    } catch (err) {
      const apiError = err as ApiClientError;
      setError(
        apiError?.status === 401
          ? 'Wrong email or password.'
          : apiError?.detail || 'Could not sign in. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'driver1@foodflow.vn', password: DEMO_PASSWORD });
    setError(null);
  };

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-bold text-gray-900">Driver sign in</h1>
      <form onSubmit={submit} className="mt-5 space-y-4">
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
          <span className="label">Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {/* Demo Quick Fill */}
      <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50/70 p-3">
        <p className="text-xs font-semibold text-orange-950">Tài khoản tài xế mẫu (Demo):</p>
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between bg-white text-xs text-gray-700 hover:bg-orange-100"
            onClick={fillDemo}
          >
            <span>Tài xế 1: <strong className="text-gray-900">driver1@foodflow.vn</strong></span>
            <span className="text-[11px] font-semibold text-orange-600">Điền nhanh</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
