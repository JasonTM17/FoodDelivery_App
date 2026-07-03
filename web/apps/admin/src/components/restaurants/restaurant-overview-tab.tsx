'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, MapPin, Phone, User } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface RestaurantOverview {
  description?: string;
  address?: string;
  cuisine?: string;
  phone?: string;
  owner?: { name?: string; email?: string; phone?: string };
  hours?: { day: string; open: string; close: string }[];
  metrics?: {
    todayOrders: number;
    todayRevenue: number;
    avgPrepTime: number;
    completionRate: number;
  };
}

export default function RestaurantOverviewTab({ restaurant }: { restaurant: { id: string } }) {
  const t = useTranslations('restaurantOverviewTab');
  const { data, isError, isLoading, refetch } = useQuery<RestaurantOverview>({
    queryKey: ['restaurant-overview', restaurant.id],
    queryFn: () => apiGet<RestaurantOverview>(`/admin/restaurants/${restaurant.id}/overview`),
    enabled: Boolean(restaurant.id),
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={t('loading')}
        className="grid gap-6 md:grid-cols-2"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert">
        <EmptyState
          icon={AlertCircle}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
          actionLabel={t('retry')}
          onAction={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    );
  }

  const unavailable = t('notAvailable');

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('generalInfoTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{data.description || t('noDescription')}</p>
          <Separator />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{data.address || unavailable}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{data.cuisine || unavailable}</span>
          </div>
          {data.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>{data.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('hoursTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.hours?.length ? (
            data.hours.map((hours) => (
              <div key={`${hours.day}-${hours.open}-${hours.close}`} className="flex items-center justify-between gap-4">
                <span>{hours.day}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {hours.open}–{hours.close}
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">{t('noHours')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('ownerTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label={t('ownerFields.name')} value={data.owner?.name || unavailable} />
          <Separator />
          <DetailRow label={t('ownerFields.email')} value={data.owner?.email || unavailable} />
          <Separator />
          <DetailRow label={t('ownerFields.phone')} value={data.owner?.phone || unavailable} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('metricsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label={t('todayOrders')} value={data.metrics?.todayOrders ?? unavailable} emphasize />
          <Separator />
          <DetailRow
            label={t('revenue')}
            value={data.metrics ? formatCurrency(data.metrics.todayRevenue) : unavailable}
            emphasize
          />
          <Separator />
          <DetailRow
            label={t('avgPrepTime')}
            value={data.metrics ? t('minutes', { value: data.metrics.avgPrepTime }) : unavailable}
            emphasize
          />
          <Separator />
          <DetailRow
            label={t('completionRate')}
            value={data.metrics ? `${data.metrics.completionRate}%` : unavailable}
            emphasize
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value, emphasize = false }: { label: string; value: string | number; emphasize?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? 'font-medium' : undefined}>{value}</span>
    </div>
  );
}
