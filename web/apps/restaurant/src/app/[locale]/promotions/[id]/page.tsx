'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import {
  ArrowLeft, Tag, Calendar, Users, BarChart3,
  Edit, Archive, Pause, Play,
} from 'lucide-react';
import { PromotionAnalytics } from '@/components/promotions/promotion-analytics';
import { fetchPromotion, updatePromotionStatus } from '@/lib/actions/promotion-actions';
import { getPromotionStatusLabel, getPromotionStatusColor, getPromotionTypeLabel, getAudienceLabel } from '@/lib/promotion-engine';
import { formatCurrency, cn } from '@/lib/utils';
import type { Promotion, PromotionStatus } from '@/lib/types';

export default function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    params.then(({ id }) => {
      fetchPromotion(id)
        .then((data) => {
          if (!cancelled) setPromo(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError((err as { message?: string }).message || 'Không thể tải khuyến mãi');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, [params]);

  const handleStatusChange = async (status: PromotionStatus) => {
    if (!promo) return;
    setProcessing(true);
    try {
      const updated = await updatePromotionStatus(promo.id, status);
      setPromo(updated);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Thao tác thất bại');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="h-40 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (error || !promo) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error || 'Không tìm thấy khuyến mãi'}
      </div>
    );
  }

  const formatValue = () => {
    switch (promo.type) {
      case 'percent': return `${promo.discountValue}%`;
      case 'fixed': return formatCurrency(promo.discountValue);
      case 'bogof':
        return promo.comboConfig
          ? `Mua ${promo.comboConfig.buy} tặng ${promo.comboConfig.get}`
          : '—';
      case 'combo':
        return 'Giá combo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/promotions')} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </button>
        <div className="flex items-center gap-2">
          {promo.status === 'active' && (
            <button
              onClick={() => handleStatusChange('paused')}
              disabled={processing}
              className="btn-ghost text-yellow-600 text-sm"
            >
              <Pause className="h-4 w-4 mr-1" />
              Tạm dừng
            </button>
          )}
          {promo.status === 'paused' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={processing}
              className="btn-ghost text-green-600 text-sm"
            >
              <Play className="h-4 w-4 mr-1" />
              Tiếp tục
            </button>
          )}
          <button
            onClick={() => router.push(`/promotions/${promo.id}/edit`)}
            className="btn-secondary text-sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
              <Tag className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{promo.name}</h1>
              <p className="font-mono text-xs text-gray-500">{promo.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getPromotionStatusColor(promo.status))}>
              {getPromotionStatusLabel(promo.status)}
            </span>
            {getPromotionTypeLabel(promo.type) && (
              <span className="badge bg-brand-50 text-brand-700 border-brand-200">
                {getPromotionTypeLabel(promo.type)}
              </span>
            )}
          </div>
        </div>

        {promo.description && (
          <p className="text-sm text-gray-600 mt-4">{promo.description}</p>
        )}

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <DetailField label="Giá trị" value={formatValue()} />
          <DetailField
            label="Đối tượng"
            value={
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {getAudienceLabel(promo.target.audience)}
              </span>
            }
          />
          <DetailField
            label="Thời gian"
            value={
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {new Date(promo.schedule.validFrom).toLocaleDateString('vi-VN')}
                {' - '}
                {new Date(promo.schedule.validUntil).toLocaleDateString('vi-VN')}
              </span>
            }
          />
          <DetailField
            label="Kênh"
            value={promo.channels.map((ch) => {
              const map: Record<string, string> = { in_app: 'In-app', push: 'Push', email: 'Email', sms: 'SMS' };
              return map[ch] || ch;
            }).join(', ')}
          />
        </dl>
      </div>

      {/* Limits */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Giới hạn & Điều kiện</h2>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DetailField label="Đơn tối thiểu" value={promo.minOrderVnd ? formatCurrency(promo.minOrderVnd) : 'Không'} />
          <DetailField label="Giảm tối đa" value={promo.maxDiscountVnd ? formatCurrency(promo.maxDiscountVnd) : 'Không giới hạn'} />
          <DetailField label="Tổng lượt dùng" value={promo.maxUsage?.toString() || 'Không giới hạn'} />
          <DetailField label="Giới hạn/khách" value={promo.perUserLimit.toString()} />
        </dl>
        {promo.stackable && (
          <span className="badge bg-blue-50 text-blue-700 border-blue-200 mt-4">
            Có thể kết hợp với khuyến mãi khác
          </span>
        )}
      </div>

      {/* Analytics */}
      {promo.status === 'active' && (
        <PromotionAnalytics promotion={promo} />
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-400 tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
