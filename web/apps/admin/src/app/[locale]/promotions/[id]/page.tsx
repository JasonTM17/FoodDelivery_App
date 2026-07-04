'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminPromotionAnalytics } from '@foodflow/api-client';
import { apiGet, apiPatch } from '@/lib/api';
import type { AdminPromotion } from '@/components/promotions/admin-promotions-types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Percent, DollarSign, Calendar, Users } from 'lucide-react';
import { Link } from '@/navigation';
import PromotionFunnelClient from './promotion-funnel-client';

export default function PromotionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const t = useTranslations('promotionDetail');
  const managementT = useTranslations('adminPromotionManagement');
  const queryClient = useQueryClient();

  const { data: promo, isLoading } = useQuery<AdminPromotion>({
    queryKey: ['promotion', id],
    queryFn: () => apiGet<AdminPromotion>(`/admin/promotions/${id}`),
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminPromotionAnalytics>({
    queryKey: ['promotion', id, 'analytics'],
    queryFn: () => apiGet<AdminPromotionAnalytics>(`/admin/promotions/${id}/analytics`),
  });

  const toggleActive = async () => {
    if (!promo) return;
    await apiPatch(`/admin/promotions/${id}/toggle`);
    queryClient.invalidateQueries({ queryKey: ['promotion', id] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('notFound')}</p>
        <Button asChild><Link href="/promotions">{t('back')}</Link></Button>
      </div>
    );
  }

  const isExpired = new Date(promo.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: t('breadcrumbParent'), href: '/promotions' },
          { label: promo.code },
        ]}
        title={promo.code}
        description={t('description')}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('activeToggle')}</span>
            <Switch checked={promo.isActive} onCheckedChange={toggleActive} />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/promotions"><ArrowLeft className="mr-2 h-4 w-4" />{t('back')}</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {promo.type === 'percentage' ? (
                  <Percent className="h-4 w-4 text-primary" />
                ) : (
                  <DollarSign className="h-4 w-4 text-primary" />
                )}
                {t('promotionInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('type')}</span>
                <Badge variant="outline">
                  {managementT(`types.${promo.type}`)}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('value')}</span>
                <span className="font-medium text-base">
                  {promo.type === 'percentage' ? `${promo.value}%` : formatCurrency(promo.value)}
                </span>
              </div>
              {promo.minOrderAmount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('minOrder')}</span>
                    <span>{formatCurrency(promo.minOrderAmount)}</span>
                  </div>
                </>
              )}
              {promo.maxDiscount !== null && promo.maxDiscount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('maxDiscount')}</span>
                    <span>{formatCurrency(promo.maxDiscount)}</span>
                  </div>
                </>
              )}
              {promo.description && (
                <>
                  <Separator />
                  <p className="text-muted-foreground">{promo.description}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                {t('validity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('startDate')}</span>
                <span>{formatDate(promo.startsAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('endDate')}</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(promo.expiresAt)}</span>
                  {isExpired && <Badge variant="destructive">{t('expired')}</Badge>}
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('createdAt')}</span>
                <span>{formatDate(promo.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                {t('usageStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('used')}</span>
                <span className="font-medium">{promo.usageCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('limit')}</span>
                <span>{promo.usageLimit > 0 ? promo.usageLimit : '∞'}</span>
              </div>
              {promo.usageLimit > 0 && (
                <>
                  <Separator />
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((promo.usageCount / promo.usageLimit) * 100, 100)}%` }}
                    />
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('totalSaved')}</span>
                <span className="font-medium text-green-600">
                  {analyticsLoading || !analytics ? '…' : formatCurrency(analytics.discountCost)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PromotionFunnelClient promotionId={id} />
    </div>
  );
}
