'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Tag, TrendingUp, Percent, DollarSign,
  ShoppingBag, Gift, Zap,
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

const TYPE_LABEL: Record<string, string> = {
  discount_percent: 'Giảm theo %',
  discount_amount: 'Giảm số tiền cố định',
  free_delivery: 'Miễn phí vận chuyển',
  buy_one_get_one: 'Mua 1 tặng 1',
  combo: 'Combo ưu đãi',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  discount_percent: Percent,
  discount_amount: DollarSign,
  free_delivery: ShoppingBag,
  buy_one_get_one: Gift,
  combo: Zap,
};

function formatValue(promo: Promotion): string {
  if (promo.type === 'discount_percent') return `${promo.value}%`;
  if (promo.type === 'discount_amount') return formatCurrency(promo.value);
  if (promo.type === 'free_delivery') return 'Miễn phí vận chuyển';
  if (promo.type === 'buy_one_get_one') return 'Mua 1 tặng 1';
  return 'Combo';
}

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ promotion: Promotion }>(`/restaurant/promotions/${params.id}`)
      .then((data) => setPromo(data.promotion))
      .catch((err: unknown) => setError((err as { message?: string }).message || 'Không tìm thấy'))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return <div className="space-y-4"><div className="h-6 w-32 skeleton" /><div className="card h-64" /></div>;
  }

  if (error || !promo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy khuyến mãi</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Khuyến mãi không tồn tại'}</p>
        <button onClick={() => router.push('/promotions')} className="btn-primary">Quay lại</button>
      </div>
    );
  }

  const IconComponent = TYPE_ICON[promo.type] || Tag;
  const redemption = promo.usageLimit > 0 ? Math.round((promo.usageCount / promo.usageLimit) * 100) : 0;
  const roi = promo.discountGiven && promo.discountGiven > 0
    ? ((promo.revenueGenerated ?? 0) / promo.discountGiven).toFixed(1)
    : null;

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/promotions')} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </button>
        <button onClick={() => router.push(`/promotions/${promo.id}/edit`)} className="btn-secondary text-sm">
          <Pencil className="h-4 w-4 mr-1.5" />
          Chỉnh sửa
        </button>
      </div>

      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', promo.active ? 'bg-brand-100' : 'bg-gray-100')}>
            <IconComponent className={cn('h-6 w-6', promo.active ? 'text-brand-600' : 'text-gray-400')} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{promo.name || promo.code}</h1>
              <span className={cn('badge text-xs', promo.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                {promo.active ? 'Đang chạy' : 'Tạm dừng'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{promo.code}</p>
          </div>
        </div>
        {promo.description && <p className="text-sm text-gray-600 mt-4">{promo.description}</p>}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <Field label="Loại" value={TYPE_LABEL[promo.type] || promo.type} />
          <Field label="Giá trị" value={formatValue(promo)} />
          <Field label="Bắt đầu" value={promo.startDate?.split('T')[0] ?? '—'} />
          <Field label="Kết thúc" value={promo.endDate?.split('T')[0] ?? '—'} />
          {promo.minOrderValue != null && promo.minOrderValue > 0
            ? <Field label="Đơn tối thiểu" value={formatCurrency(promo.minOrderValue)} /> : null}
        </dl>
      </div>

      {/* Usage analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Lượt dùng</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-900">{promo.usageCount}</span>
            <span className="text-sm text-gray-400 mb-1">/ {promo.usageLimit > 0 ? promo.usageLimit : '∞'}</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', redemption > 80 ? 'bg-red-400' : redemption > 50 ? 'bg-brand-500' : 'bg-green-400')}
              style={{ width: `${Math.min(redemption, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{redemption}% đã dùng</p>
        </div>

        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Doanh thu từ KM</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(promo.revenueGenerated ?? 0)}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Tổng giảm giá</p>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(promo.discountGiven ?? 0)}
            </span>
          </div>
          {roi && (
            <p className={cn('text-xs mt-1 font-medium', parseFloat(roi) > 2 ? 'text-green-600' : 'text-amber-600')}>
              ROI: {roi}x
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
