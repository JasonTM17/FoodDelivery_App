'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  endDate: string;
}

export default function PromotionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('promotions');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Promotion | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ promotion: Promotion }>(`/restaurant/promotions/${id}`)
      .then((data) => {
        if (!cancelled) setForm(data.promotion);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/restaurant/promotions/${id}`, {
        active: form.active,
        description: form.description,
        endDate: form.endDate,
      });
      router.push(`/promotions/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
  if (!form) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t('listError')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href={`/promotions/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('edit')}</h1>
        <p className="font-mono text-xs text-muted-foreground">{form.code}</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <Field label={t('promoName')}>
          <input
            type="text"
            value={form.name}
            disabled
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label={t('endDate')}>
          <input
            type="date"
            value={form.endDate?.split('T')[0] ?? ''}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm font-medium">{t('active')}</span>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4"
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href={`/promotions/${id}`}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
          >
            {t('cancel')}
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
