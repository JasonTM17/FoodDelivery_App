'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingUp, Filter } from 'lucide-react';

interface PromotionAnalytics {
  funnel: {
    impressions: number;
    clicks: number;
    applied: number;
    converted: number;
  };
  roi: {
    discountCost: number;
    revenueGenerated: number;
    netROI: number;
  };
  fraudFlags: {
    id: string;
    type: 'duplicate_ip' | 'velocity' | 'suspicious_account';
    description: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }[];
}

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
};

function FunnelStep({ label, count, prev }: { label: string; count: number; prev?: number }) {
  const pct = prev && prev > 0 ? Math.round((count / prev) * 100) : 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{count.toLocaleString()}</span>
          {prev !== undefined && (
            <Badge variant="outline" className="text-xs">{pct}%</Badge>
          )}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PromotionFunnelClient({ promotionId }: { promotionId: string }) {
  const t = useTranslations('promotionDetail');

  const { data, isLoading } = useQuery<PromotionAnalytics>({
    queryKey: ['promotion-analytics', promotionId],
    queryFn: () => apiGet<PromotionAnalytics>(`/admin/promotions/${promotionId}/analytics`),
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

  const { funnel, roi, fraudFlags } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            {t('funnel')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FunnelStep label={t('funnelImpressions')} count={funnel.impressions} />
          <FunnelStep label={t('funnelClicks')} count={funnel.clicks} prev={funnel.impressions} />
          <FunnelStep label={t('funnelApplied')} count={funnel.applied} prev={funnel.clicks} />
          <FunnelStep label={t('funnelConverted')} count={funnel.converted} prev={funnel.applied} />
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
            <span className="text-destructive">-{formatCurrency(roi.discountCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('roiRevenue')}</span>
            <span className="text-emerald-600">+{formatCurrency(roi.revenueGenerated)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>{t('roiNet')}</span>
            <span className={roi.netROI >= 0 ? 'text-emerald-600' : 'text-destructive'}>
              {roi.netROI >= 0 ? '+' : ''}{formatCurrency(roi.netROI)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('fraudFlags')}
            {fraudFlags.length > 0 && (
              <Badge variant="destructive" className="ml-auto">{fraudFlags.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fraudFlags.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">{t('noFraudFlags')}</p>
          ) : (
            <div className="space-y-3">
              {fraudFlags.map((flag) => (
                <div key={flag.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{flag.description}</p>
                    <p className="text-xs text-muted-foreground">{flag.count} {t('occurrences')}</p>
                  </div>
                  <Badge variant={SEVERITY_VARIANT[flag.severity]}>{flag.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
