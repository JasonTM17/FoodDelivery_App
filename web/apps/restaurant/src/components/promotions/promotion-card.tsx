'use client';

import Link from 'next/link';
import { Tag, Percent, DollarSign, ShoppingBag, Gift, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { PromotionStatusBadge } from './promotion-status-badge';
import { calculateRedemptionRate, calculateROI } from '@/lib/promotion-engine';

interface PromotionCardProps {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'discount_percent' | 'discount_amount' | 'free_delivery' | 'buy_one_get_one' | 'combo';
  value: number;
  active: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number;
  minOrderValue?: number;
  revenueGenerated?: number;
  discountGiven?: number;
  className?: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  discount_percent: Percent,
  discount_amount: DollarSign,
  free_delivery: ShoppingBag,
  buy_one_get_one: Gift,
  combo: Zap,
};

function formatValue(type: string, value: number): string {
  if (type === 'discount_percent') return `${value}%`;
  if (type === 'discount_amount') return formatCurrency(value);
  if (type === 'free_delivery') return 'Miễn phí vận chuyển';
  if (type === 'buy_one_get_one') return 'Mua 1 tặng 1';
  return 'Combo';
}

export function PromotionCard({
  id, code, name, description, type, value, active, startDate, endDate,
  usageCount, usageLimit, minOrderValue, revenueGenerated, discountGiven, className,
}: PromotionCardProps) {
  const IconComponent = TYPE_ICON[type] || Tag;
  const redemption = calculateRedemptionRate(usageCount, usageLimit);
  const roi = calculateROI(revenueGenerated ?? 0, discountGiven ?? 0);

  return (
    <Link
      href={`/promotions/${id}`}
      className={cn(
        'card block hover:shadow-elevated hover:-translate-y-0.5 transition-all cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', active ? 'bg-brand-100' : 'bg-gray-100')}>
            <IconComponent className={cn('h-5 w-5', active ? 'text-brand-600' : 'text-gray-400')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{name || code}</h3>
            <p className="text-xs text-gray-500 font-mono">{code}</p>
          </div>
        </div>
        <PromotionStatusBadge active={active} startDate={startDate} endDate={endDate} />
      </div>

      {description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
        <span>{formatValue(type, value)}</span>
        {minOrderValue != null && minOrderValue > 0 && (
          <span className="text-xs text-gray-400">| Đơn tối thiểu {formatCurrency(minOrderValue)}</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{usageCount} / {usageLimit > 0 ? usageLimit : '∞'} lượt</span>
          <span className="text-gray-500">{redemption}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', redemption > 80 ? 'bg-red-400' : redemption > 50 ? 'bg-brand-500' : 'bg-green-400')}
            style={{ width: `${Math.min(redemption, 100)}%` }}
          />
        </div>
      </div>

      {(revenueGenerated != null || discountGiven != null) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          {revenueGenerated != null && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-gray-500">{formatCurrency(revenueGenerated)}</span>
            </div>
          )}
          {roi != null && (
            <span className={cn('text-xs font-medium', roi > 2 ? 'text-green-600' : 'text-amber-600')}>
              ROI {roi}x
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
