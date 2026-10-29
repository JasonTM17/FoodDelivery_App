'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@foodflow/ui';
import { LogOut, MapPin, ReceiptText } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { ErrorBlock, LoadingBlock } from '@/components/feedback';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthChecked, logout, refreshUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/profile');
      return;
    }
    setForm({ fullName: user?.fullName ?? '', phone: user?.phone ?? '' });
  }, [isAuthChecked, isAuthenticated, user, router]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch('/users/me', {
        fullName: form.fullName.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e?.detail || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }, [form, refreshUser]);

  if (!isAuthChecked) return <LoadingBlock label="Loading profile" />;
  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Account</h1>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-primary">
            {user?.fullName?.slice(0, 1) ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{user?.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <label className="block">
          <span className="label">Full name</span>
          <input
            className="input-field"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            maxLength={100}
          />
        </label>
        <label className="block">
          <span className="label">Phone</span>
          <input
            className="input-field"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+84…"
            maxLength={20}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-green-700">
            Profile saved.
          </p>
        )}
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Card>

      <nav aria-label="Account" className="space-y-2">
        <Link
          href="/addresses"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm font-medium text-gray-900 transition-shadow hover:shadow-md"
        >
          <MapPin className="h-5 w-5 text-primary" aria-hidden />
          Addresses
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm font-medium text-gray-900 transition-shadow hover:shadow-md"
        >
          <ReceiptText className="h-5 w-5 text-primary" aria-hidden />
          Orders
        </Link>
      </nav>

      <Button
        variant="outline"
        className="w-full gap-2 text-red-600"
        onClick={() => {
          logout();
          router.replace('/home');
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </Button>

      {error && !saving ? <ErrorBlock message={error} /> : null}
    </div>
  );
}
