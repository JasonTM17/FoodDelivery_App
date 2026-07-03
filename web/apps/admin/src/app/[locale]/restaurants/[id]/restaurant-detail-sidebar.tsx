'use client';

import { type ComponentType, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, Star, Store } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RestaurantKpiCard } from './restaurant-kpi-card';
import type { Restaurant } from './restaurant-detail-types';

export function RestaurantDetailSidebar({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="space-y-6">
      <OwnerInformationCard restaurant={restaurant} />
      <RestaurantStatisticsCard restaurant={restaurant} />
      <RestaurantKpiCard restaurantId={restaurant.id} />
    </div>
  );
}

function OwnerInformationCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurantDetail');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ownerTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <OwnerField icon={Store} value={restaurant.owner?.name} />
        <OwnerField icon={Mail} value={restaurant.owner?.email} />
        <OwnerField icon={Phone} value={restaurant.owner?.phone} />
      </CardContent>
    </Card>
  );
}

function OwnerField({ icon: Icon, value }: { icon: ComponentType<{ className?: string }>; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{value ?? '—'}</span>
    </div>
  );
}

function RestaurantStatisticsCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurantDetail');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('statisticsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <StatisticRow label={t('rating')}>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {restaurant.rating.toFixed(1)}
          </div>
        </StatisticRow>
        <Separator />
        <StatisticRow label={t('totalOrders')}>{restaurant.totalOrders}</StatisticRow>
        <Separator />
        <StatisticRow label={t('revenue')}>{formatCurrency(restaurant.revenue || 0)}</StatisticRow>
        <Separator />
        <StatisticRow label={t('createdAt')}>{formatDate(restaurant.createdAt)}</StatisticRow>
      </CardContent>
    </Card>
  );
}

function StatisticRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
