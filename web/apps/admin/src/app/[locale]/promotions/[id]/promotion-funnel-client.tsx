'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminPromotionAnalytics } from '@foodflow/api-client';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Percent, TrendingUp } from 'lucide-react';

function formatRoiRatio(roi: number | null) {
  if (roi === null) return '—';
  return `${(roi * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
}

export default function PromotionFunnelClient({ promotionId }: { promotionId: string }) {
  const t = useTranslations('promotionDetail');

  const { data, isLoading } = useQuery<AdminPromotionAnalytics>({
    queryKey: ['promotion-analytics', promotionId],
    queryFn: () => apiGet<AdminPromotionAnalytics>(`/admin/promotions/${promotionId}/analytics`),
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const netReturn = data.gmv - data.discountCost;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4 text-primary" />
            {t('usageStats')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('used')}</span>
            <span className="font-medium">{data.redemptions.toLocaleString('vi-VN')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('totalSaved')}</span>
            <span className="font-medium text-emerald-600">{formatCurrency(data.discountCost)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('roi')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('roiDiscountCost')}</span>
            <span className="text-destructive">-{formatCurrency(data.discountCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('roiRevenue')}</span>
            <span className="text-emerald-600">+{formatCurrency(data.gmv)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>{t('roiNet')}</span>
            <span className={netReturn >= 0 ? 'text-emerald-600' : 'text-destructive'}>
              {netReturn >= 0 ? '+' : ''}{formatCurrency(netReturn)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('roi')}</span>
            <span>{formatRoiRatio(data.roi)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
