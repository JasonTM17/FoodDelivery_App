'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Tag, TrendingUp, Percent, DollarSign, ShoppingBag,
  Gift, Zap, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface Promotion {
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
}

type PromoType = Promotion['type'];

const TYPE_LABEL: Record<PromoType, string> = {
  discount_percent: 'Giảm %',
  discount_amount: 'Giảm tiền',
  free_delivery: 'Miễn phí vận chuyển',
  buy_one_get_one: 'Mua 1 tặng 1',
  combo: 'Combo',
};

const TYPE_ICON: Record<PromoType, React.ElementType> = {
  discount_percent: Percent,
  discount_amount: DollarSign,
  free_delivery: ShoppingBag,
  buy_one_get_one: Gift,
  combo: Zap,
};

function formatValue(promo: Promotion): string {
  if (promo.type === 'discount_percent') return `${promo.value}%`;
  if (promo.type === 'discount_amount') return formatCurrency(promo.value);
  if (promo.type === 'free_delivery') return '0đ ship';
  if (promo.type === 'buy_one_get_one') return 'BOGOF';
  return 'Combo';
}

export default function PromotionsPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ promotions: Promotion[] }>('/restaurant/promotions')
      .then((data) => setPromos(data.promotions ?? []))
      .catch((err: unknown) => setError((err as { message?: string }).message || 'Không thể tải danh sách'))
      .finally(() => setIsLoading(false));
  }, []);

  const activePromos = promos.filter((p) => p.active);
  const totalRevenue = activePromos.reduce((s, p) => s + (p.revenueGenerated ?? 0), 0);
  const totalDiscount = activePromos.reduce((s, p) => s + (p.discountGiven ?? 0), 0);
  const avgRedemption = activePromos.length > 0
    ? Math.round(activePromos.reduce((s, p) => s + (p.usageLimit > 0 ? (p.usageCount / p.usageLimit) * 100 : 0), 0) / activePromos.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 skeleton" />
            <div className="h-4 w-60 skeleton" />
          </div>
          <div className="h-9 w-24 skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kpi-card space-y-3"><div className="h-4 w-24 skeleton" /><div className="h-8 w-32 skeleton" /></div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Tag className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Khuyến mãi</h1>
            <p className="text-sm text-gray-500">Quản lý chương trình ưu đãi</p>
          </div>
        </div>
        <button onClick={() => router.push('/promotions/new')} className="btn-primary">
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo khuyến mãi
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Analytics overview */}
      {activePromos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Doanh thu từ KM</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">Tổng giảm giá</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalDiscount)}</p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <Percent className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Tỷ lệ dùng TB</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{avgRedemption}%</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {promos.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <Tag className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có khuyến mãi</h3>
          <p className="text-sm text-gray-500 mb-6">Tạo chương trình đầu tiên để thu hút khách hàng</p>
          <button onClick={() => router.push('/promotions/new')} className="btn-primary">
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo khuyến mãi
          </button>
        </div>
      )}

      {/* Promotion list with analytics */}
      {promos.map((promo) => {
        const IconComponent = TYPE_ICON[promo.type] || Tag;
        const redemption = promo.usageLimit > 0 ? Math.round((promo.usageCount / promo.usageLimit) * 100) : 0;
        const isExpiringSoon = promo.endDate && new Date(promo.endDate).getTime() - Date.now() < 7 * 86400000;
        const roi = promo.discountGiven && promo.discountGiven > 0
          ? ((promo.revenueGenerated ?? 0) / promo.discountGiven).toFixed(1)
          : null;

        return (
          <div
            key={promo.id}
            onClick={() => router.push(`/promotions/${promo.id}`)}
            className="card cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                promo.active ? 'bg-brand-100' : 'bg-gray-100'
              )}>
                <IconComponent className={cn('h-5 w-5', promo.active ? 'text-brand-600' : 'text-gray-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {promo.name || promo.code}
                  </h3>
                  <span className={cn(
                    'badge text-[10px] shrink-0',
                    promo.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  )}>
                    {promo.active ? 'Đang chạy' : 'Tạm dừng'}
                  </span>
                  {isExpiringSoon && promo.active && (
                    <span className="badge bg-amber-100 text-amber-700 border-amber-200 text-[10px] shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                      Sắp hết hạn
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono">{promo.code}</span>
                  <span>{TYPE_LABEL[promo.type]}</span>
                  <span>{formatValue(promo)}</span>
                </div>

                {/* Usage bar + metrics */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Đã dùng: {promo.usageCount}/{promo.usageLimit > 0 ? promo.usageLimit : '∞'}</span>
                    <span>{redemption}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        redemption > 80 ? 'bg-red-400' : redemption > 50 ? 'bg-brand-500' : 'bg-green-400'
                      )}
                      style={{ width: `${Math.min(redemption, 100)}%` }}
                    />
                  </div>

                  {/* Analytics per promotion */}
                  <div className="flex gap-4 text-xs pt-1">
                    {promo.revenueGenerated != null && (
                      <span className="text-gray-500">
                        Doanh thu: <span className="font-medium text-gray-700">{formatCurrency(promo.revenueGenerated)}</span>
                      </span>
                    )}
                    {promo.discountGiven != null && (
                      <span className="text-gray-500">
                        Đã giảm: <span className="font-medium text-gray-700">{formatCurrency(promo.discountGiven)}</span>
                      </span>
                    )}
                    {roi && (
                      <span className={cn(
                        'font-medium',
                        parseFloat(roi) > 2 ? 'text-green-600' : 'text-amber-600'
                      )}>
                        ROI: {roi}x
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 shrink-0 self-center" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
