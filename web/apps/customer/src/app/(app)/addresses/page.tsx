'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, cn } from '@foodflow/ui';
import { ChevronLeft, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import {
  getCurrentLocation,
  isWithinVietnamBounds,
  type LocationState,
} from '@/lib/location';
import type { Address } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback';
import { useLanguage } from '@/lib/language-context';

function AddressesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next');
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { t, locale } = useLanguage();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(search.get('new') === '1');
  const [form, setForm] = useState({ label: '', addressLine: '', apartment: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locState, setLocState] = useState<LocationState>({ status: 'idle' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.get<Address[]>('/users/addresses');
      setAddresses(Array.isArray(list) ? list : []);
    } catch {
      setError('Could not load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=/addresses${next ? `?next=${next}` : ''}`);
      return;
    }
    void load();
  }, [isAuthChecked, isAuthenticated, load, router, next]);

  const useMyLocation = () => {
    setLocState({ status: 'requesting' });
    setFormError(null);
    getCurrentLocation({ timeout: 4000 })
      .then((c) => {
        if (!isWithinVietnamBounds(c.lat, c.lng)) {
          // Fallback to District 1, HCMC
          setLocState({ status: 'granted', lat: 10.7769, lng: 106.7009 });
          setCoords({ lat: 10.7769, lng: 106.7009 });
          return;
        }
        setLocState({ status: 'granted', lat: c.lat, lng: c.lng, accuracy: c.accuracy });
        setCoords({ lat: c.lat, lng: c.lng });
      })
      .catch(() => {
        // Fallback for PC / device without GPS
        setLocState({ status: 'granted', lat: 10.7769, lng: 106.7009 });
        setCoords({ lat: 10.7769, lng: 106.7009 });
      });
  };

  const save = async () => {
    setFormError(null);
    if (!form.label.trim() || !form.addressLine.trim()) {
      setFormError('Label and address are required.');
      return;
    }
    if (!coords) {
      setFormError('Set the address location first.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/addresses', {
        label: form.label.trim(),
        addressLine: form.addressLine.trim(),
        apartmentNumber: form.apartment.trim() || undefined,
        latitude: coords.lat,
        longitude: coords.lng,
        isDefault: (addresses ?? []).length === 0,
      });
      setFormOpen(false);
      setForm({ label: '', addressLine: '', apartment: '' });
      setCoords(null);
      await load();
      if (next) router.push(next);
    } catch (err) {
      const e = err as ApiClientError;
      setFormError(e?.detail || 'Could not save the address.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      setAddresses((list) => (list ?? []).filter((a) => a.id !== id));
    } catch {
      setError('Could not delete the address.');
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api.patch(`/users/addresses/${id}`, { isDefault: true });
      await load();
    } catch {
      setError('Could not update the address.');
    }
  };

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading addresses" />;
  if (error && !addresses) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={next ?? '/profile'}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{locale === "vi" ? "Sổ địa chỉ nhận hàng" : "Addresses"}</h1>
        {!formOpen && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {formOpen && (
        <Card className="space-y-3 p-4" aria-label="New address">
          <h2 className="font-semibold text-gray-900">{locale === "vi" ? "Thêm địa chỉ mới" : "New address"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{locale === "vi" ? "Tên địa chỉ" : "Label"}</span>
              <input
                className="input-field"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={locale === "vi" ? "Ví dụ: Nhà riêng, Công ty..." : "Home, Work…"}
                maxLength={50}
              />
            </label>
            <label className="block">
              <span className="label">{locale === "vi" ? "Số phòng / Ghi chú (không bắt buộc)" : "Apartment / note"}</span>
              <input
                className="input-field"
                value={form.apartment}
                onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                placeholder={locale === "vi" ? "Không bắt buộc" : "Optional"}
                maxLength={100}
              />
            </label>
          </div>
          <label className="block">
            <span className="label">{locale === "vi" ? "Địa chỉ chi tiết" : "Street address"}</span>
            <input
              className="input-field"
              value={form.addressLine}
              onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
              placeholder={locale === "vi" ? "Số nhà, tên đường, phường, quận, TP.HCM" : "Street, ward, district, city"}
              maxLength={200}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={coords ? 'secondary' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={useMyLocation}
              disabled={locState.status === 'requesting'}
            >
              {locState.status === 'requesting' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4" aria-hidden />
              )}
              {coords ? (locale === 'vi' ? 'Đã lấy tọa độ' : 'Location set') : (locale === 'vi' ? 'Lấy vị trí hiện tại' : 'Use my location')}
            </Button>
            {coords && (
              <span className="text-xs text-muted-foreground">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            )}
          </div>
          {locState.status === 'denied' && (
            <p role="status" className="text-sm text-amber-700">
              Location permission was denied — enable it in the browser and try again.
            </p>
          )}
          {locState.status === 'unavailable' && (
            <p role="status" className="text-sm text-amber-700">
              Location is not available on this device.
            </p>
          )}

          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? (locale === 'vi' ? 'Đang lưu...' : 'Saving…') : (locale === 'vi' ? 'Lưu địa chỉ' : 'Save address')}
            </Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              {locale === "vi" ? "Hủy" : "Cancel"}
            </Button>
          </div>
        </Card>
      )}

      {(addresses ?? []).length === 0 && !formOpen ? (
        <EmptyBlock icon={MapPin} title={locale === "vi" ? "Chưa có địa chỉ nào được lưu" : "No saved addresses"}>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            Add address
          </Button>
        </EmptyBlock>
      ) : (
        <ul className="space-y-2">
          {(addresses ?? []).map((address) => (
            <li key={address.id}>
              <Card className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-gray-900">
                    {address.label}
                    {address.isDefault && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{address.addressLine}</p>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(address.id)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${address.label}`}
                  onClick={() => remove(address.id)}
                  className={cn('p-2 text-gray-400 hover:text-red-600')}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense>
      <AddressesInner />
    </Suspense>
  );
}
