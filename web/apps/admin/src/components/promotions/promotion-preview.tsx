'use client';

import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent, DollarSign, Gift, Truck } from 'lucide-react';

interface PromotionPreviewProps {
  values: {
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    minOrderVnd?: number;
    maxDiscountVnd?: number;
    audience: string;
    perUserLimit: number;
    maxUsage?: number;
    active: boolean;
    description?: string;
  };
}

const audienceLabels: Record<string, string> = {
  all: 'Tất cả người dùng',
  new: 'Người dùng mới',
  vip: 'Người dùng VIP',
  segment: 'Phân khúc',
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  percent: Percent,
  fixed: DollarSign,
  bogo: Gift,
  shipping: Truck,
};

export default function PromotionPreview({ values }: PromotionPreviewProps) {
  const Icon = typeIcons[values.discountType] || Percent;
  const hasContent = values.code || values.name;

  return (
    <Card data-testid="promotion-preview" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Xem trước</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasContent ? (
          <p className="text-xs text-muted-foreground">Nhập thông tin để xem trước</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold">{values.code || 'CODE'}</span>
              <Badge variant={values.active ? 'success' : 'secondary'}>
                {values.active ? 'Kích hoạt' : 'Tạm tắt'}
              </Badge>
            </div>
            {values.name && <p className="text-sm font-medium">{values.name}</p>}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {values.discountType === 'percent'
                  ? `Giảm ${values.discountValue || 0}%`
                  : values.discountType === 'fixed'
                  ? `Giảm ${formatCurrency(values.discountValue || 0)}`
                  : values.discountType === 'bogo'
                  ? 'Mua 1 tặng 1'
                  : 'Miễn phí vận chuyển'}
              </span>
            </div>
            {values.minOrderVnd && values.minOrderVnd > 0 ? (
              <p className="text-xs text-muted-foreground">Đơn tối thiểu: {formatCurrency(values.minOrderVnd)}</p>
            ) : null}
            {values.maxDiscountVnd && values.maxDiscountVnd > 0 ? (
              <p className="text-xs text-muted-foreground">Giảm tối đa: {formatCurrency(values.maxDiscountVnd)}</p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">{audienceLabels[values.audience] || values.audience}</Badge>
              <Badge variant="outline" className="text-[10px]">{values.perUserLimit} lần/người</Badge>
              {values.maxUsage && values.maxUsage > 0 ? (
                <Badge variant="outline" className="text-[10px]">Tối đa {values.maxUsage} lượt</Badge>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
