'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { Plus, Tag } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number;
}

export default function PromotionsListPage() {
  const t = useTranslations('promotions');
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ promotions: Promotion[] }>('/restaurant/promotions')
      .then((data) => {
        if (!cancelled) setPromos(data.promotions ?? []);
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
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t('listError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('listTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('listSubtitle')}</p>
        </div>
        <Link
          href="/promotions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t('createNew')}
        </Link>
      </div>

      {promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">{t('emptyTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('emptySubtitle')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {promos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/promotions/${p.id}`}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-semibold">{p.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.type === 'percentage' ? `${p.value}%` : `${p.value.toLocaleString()}đ`} ·{' '}
                    {p.usageCount}/{p.usageLimit > 0 ? p.usageLimit : '∞'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.active ? t('active') : t('inactive')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
