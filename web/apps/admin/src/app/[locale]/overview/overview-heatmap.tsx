'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AdminDispatchHeatmapPoint } from '@foodflow/api-client';
import { apiGet } from '@/lib/api';
import { MapPin, AlertCircle } from 'lucide-react';

export default function OverviewHeatmap() {
  const t = useTranslations('overview');
  const [cells, setCells] = useState<AdminDispatchHeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const data = await apiGet<AdminDispatchHeatmapPoint[]>('/admin/dispatch/heatmap', {
          params: { since },
        });
        if (!cancelled) {
          setCells(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {t('heatmapError')}
      </div>
    );
  }

  const maxCount = Math.max(1, ...cells.map((c) => c.orderCount));
  const sorted = [...cells].sort((a, b) => b.orderCount - a.orderCount);

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t('heatmapTitle')}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{t('heatmapPeriod')}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('heatmapEmpty')}</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {sorted.map((c) => {
            const intensity = c.orderCount / maxCount;
            const bgClass =
              intensity > 0.7 ? 'bg-red-500/15' : intensity > 0.4 ? 'bg-amber-500/15' : 'bg-green-500/10';
            return (
              <li
                key={c.districtCode}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${bgClass}`}
              >
                <span className="font-mono text-sm">{c.districtCode}</span>
                <span className="text-sm font-semibold">{c.orderCount}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
