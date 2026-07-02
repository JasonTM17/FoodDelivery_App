'use client';

import { useTranslations } from 'next-intl';
import type { PromotionFormValues } from '@/lib/schemas/promotion-schema';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent, DollarSign, Gift, Truck } from 'lucide-react';

interface PromotionPreviewProps {
  values: PromotionFormValues;
}

const typeIcons: Record<
  PromotionFormValues['discountType'],
  React.ComponentType<{ className?: string }>
> = {
  combo: Gift,
  percent: Percent,
  fixed: DollarSign,
  bogo: Gift,
  shipping: Truck,
};

export default function PromotionPreview({ values }: PromotionPreviewProps) {
  const t = useTranslations('adminPromotionManagement');
  const Icon = typeIcons[values.discountType];
  const hasContent = Boolean(values.code || values.name);
  const offerLabel = {
    percent: t('preview.percentOffer', { value: values.discountValue || 0 }),
    fixed: t('preview.fixedOffer', { value: formatCurrency(values.discountValue || 0) }),
    bogo: t('preview.bogoOffer'),
    combo: t('preview.comboOffer'),
    shipping: t('preview.shippingOffer'),
  }[values.discountType];

  return (
    <Card data-testid="promotion-preview" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('preview.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasContent ? (
          <p className="text-xs text-muted-foreground">{t('preview.empty')}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold">{values.code || 'CODE'}</span>
              <Badge variant={values.active ? 'success' : 'secondary'}>
                {values.active ? t('preview.active') : t('preview.inactive')}
              </Badge>
            </div>
            {values.name && <p className="text-sm font-medium">{values.name}</p>}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{offerLabel}</span>
            </div>
            {values.minOrderVnd && values.minOrderVnd > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('preview.minimumOrder', { value: formatCurrency(values.minOrderVnd) })}
              </p>
            ) : null}
            {values.maxDiscountVnd && values.maxDiscountVnd > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('preview.maximumDiscount', { value: formatCurrency(values.maxDiscountVnd) })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">{t(`audiences.${values.audience}`)}</Badge>
              <Badge variant="outline" className="text-[10px]">
                {t('preview.perUser', { count: values.perUserLimit })}
              </Badge>
              {values.maxUsage && values.maxUsage > 0 ? (
                <Badge variant="outline" className="text-[10px]">
                  {t('preview.maxUsage', { count: values.maxUsage })}
                </Badge>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
