'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPut } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Percent, DollarSign, Calendar, Users } from 'lucide-react';
import { Link } from '@/navigation';

interface PromotionDetail {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageCount: number;
  usageLimit: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  description: string;
  createdAt: string;
  totalSaved: number;
}

export default function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('promotionDetail');
  const queryClient = useQueryClient();

  const { data: promo, isLoading } = useQuery<PromotionDetail>({
    queryKey: ['promotion', id],
    queryFn: () => apiGet<PromotionDetail>(`/admin/promotions/${id}`),
  });

  const toggleActive = async () => {
    if (!promo) return;
    await apiPut(`/admin/promotions/${id}`, { active: !promo.active });
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
        <p className="text-destructive">Không tìm thấy khuyến mãi</p>
        <Button asChild><Link href="/promotions">Quay lại</Link></Button>
      </div>
    );
  }

  const isExpired = promo.endDate ? new Date(promo.endDate) < new Date() : false;

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
            <Switch checked={promo.active} onCheckedChange={toggleActive} />
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
                  {promo.type === 'percentage' ? t('typePercentage') : t('typeFixed')}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('value')}</span>
                <span className="font-medium text-base">
                  {promo.type === 'percentage' ? `${promo.value}%` : formatCurrency(promo.value)}
                </span>
              </div>
              {promo.minOrder > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('minOrder')}</span>
                    <span>{formatCurrency(promo.minOrder)}</span>
                  </div>
                </>
              )}
              {promo.maxDiscount > 0 && (
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
                <span>{promo.startDate ? formatDate(promo.startDate) : t('noLimit')}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('endDate')}</span>
                <div className="flex items-center gap-2">
                  <span>{promo.endDate ? formatDate(promo.endDate) : t('noLimit')}</span>
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
                <span className="font-medium text-green-600">{formatCurrency(promo.totalSaved || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
