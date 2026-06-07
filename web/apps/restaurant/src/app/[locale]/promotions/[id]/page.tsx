'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Pencil, Tag } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'discount_percent' | 'discount_amount' | 'free_delivery' | 'percentage' | 'fixed';
  value: number;
  active: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number;
  minOrderValue?: number;
}

export default function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('promotions');
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ promotion: Promotion }>(`/restaurant/promotions/${id}`)
      .then((data) => {
        if (!cancelled) setPromo(data.promotion);
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

  if (loading) {
    return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
  }

  if (error || !promo) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t('listError')}
      </div>
    );
  }

  const formatValue = () => {
    if (promo.type === 'percentage' || promo.type === 'discount_percent') return `${promo.value}%`;
    if (promo.type === 'free_delivery') return '—';
    return `${promo.value.toLocaleString()}đ`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/promotions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Link>
        <Link
          href={`/promotions/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Pencil className="h-4 w-4" />
          {t('edit')}
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{promo.name || promo.code}</h1>
            <p className="font-mono text-xs text-muted-foreground">{promo.code}</p>
          </div>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
              promo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {promo.active ? t('active') : t('inactive')}
          </span>
        </div>

        {promo.description ? (
          <p className="text-sm text-muted-foreground">{promo.description}</p>
        ) : null}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Field label={t('value')} value={formatValue()} />
          <Field label={t('usage')} value={`${promo.usageCount}/${promo.usageLimit > 0 ? promo.usageLimit : '∞'}`} />
          <Field label={t('startDate')} value={promo.startDate?.split('T')[0] ?? '—'} />
          <Field label={t('endDate')} value={promo.endDate?.split('T')[0] ?? '—'} />
          {promo.minOrderValue ? (
            <Field label={t('minOrder')} value={`${promo.minOrderValue.toLocaleString()}đ`} />
          ) : null}
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground tracking-wide">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
