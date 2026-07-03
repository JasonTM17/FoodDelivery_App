'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface RestaurantKpi {
  avgPrepTimeMin: number;
  fulfillmentRate: number;
  ratingTrend: { date: string; rating: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export function RestaurantKpiCard({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations('restaurants');
  const [kpi, setKpi] = useState<RestaurantKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<RestaurantKpi>(`/admin/restaurants/${restaurantId}/kpi?period=7d`)
      .then((data) => {
        if (!cancelled) setKpi(data);
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
  }, [restaurantId]);

  if (loading) {
    return <div className="h-40 bg-muted/40 animate-pulse rounded-lg" />;
  }

  if (error || !kpi) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="p-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {t('kpiError')}
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = kpi.revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
  const avgRating =
    kpi.ratingTrend.length > 0
      ? kpi.ratingTrend.reduce((sum, r) => sum + r.rating, 0) / kpi.ratingTrend.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('kpiTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <KpiStat
          icon={<Clock className="h-4 w-4" />}
          label={t('kpiPrepTime')}
          value={`${kpi.avgPrepTimeMin.toFixed(1)} min`}
        />
        <KpiStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={t('kpiFulfillment')}
          value={`${(kpi.fulfillmentRate * 100).toFixed(1)}%`}
        />
        <KpiStat
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('kpiAvgRating')}
          value={avgRating.toFixed(2)}
        />
        <KpiStat
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('kpiRevenue7d')}
          value={formatCurrency(totalRevenue)}
        />
      </CardContent>
    </Card>
  );
}

function KpiStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
