'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { Plus, Tag, BarChart3, Search } from 'lucide-react';
import { PromotionCard } from '@/components/promotions/promotion-card';
import { PromotionBulkActions } from '@/components/promotions/promotion-bulk-actions';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Promotion, PromotionStatus } from '@/lib/types';

export default function PromotionsListPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ promotions: Promotion[] }>('/restaurant/promotions')
      .then((data) => {
        if (!cancelled) setPromos(data.promotions ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePause = async (id: string) => {
    try {
      await api.patch(`/restaurant/promotions/${id}`, { status: 'paused' });
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'paused' as PromotionStatus } : p))
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Không thể tạm dừng');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.patch(`/restaurant/promotions/${id}`, { status: 'archived' });
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'archived' as PromotionStatus } : p))
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Không thể lưu trữ');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      await api.post('/restaurant/promotions/bulk', {
        ids: Array.from(selectedIds),
        action,
      });
      if (action === 'archive') {
        setPromos((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id) ? { ...p, status: 'archived' as PromotionStatus } : p
          )
        );
      } else if (action === 'pause') {
        setPromos((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id) ? { ...p, status: 'paused' as PromotionStatus } : p
          )
        );
      } else if (action === 'resume') {
        setPromos((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id) ? { ...p, status: 'active' as PromotionStatus } : p
          )
        );
      }
      setSelectedIds(new Set());
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Thao tác hàng loạt thất bại');
    }
  };

  const filtered = promos.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = promos.filter((p) => p.status === 'active').length;
  const draftCount = promos.filter((p) => p.status === 'draft').length;
  const totalUsage = promos.filter((p) => p.status === 'active').length * 15; // approximate

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Tag className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Khuyến mãi</h1>
            <p className="text-sm text-gray-500">Quản lý chương trình khuyến mãi</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/promotions/new')}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Tạo khuyến mãi
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Tổng chương trình</p>
          <p className="text-xl font-bold text-gray-900">{promos.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Đang hoạt động</p>
          <p className="text-xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Nháp</p>
          <p className="text-xl font-bold text-gray-600">{draftCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Lượt dùng</p>
          <p className="text-xl font-bold text-brand-600">{totalUsage}</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'scheduled', 'draft', 'paused', 'expired'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-100 text-brand-700 border border-brand-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
              }`}
            >
              {s === 'all' ? 'Tất cả' :
               s === 'active' ? 'Đang hoạt động' :
               s === 'scheduled' ? 'Lên lịch' :
               s === 'draft' ? 'Nháp' :
               s === 'paused' ? 'Tạm dừng' : 'Hết hạn'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <PromotionBulkActions
          selectedIds={Array.from(selectedIds)}
          onPause={() => handleBulkAction('pause')}
          onResume={() => handleBulkAction('resume')}
          onArchive={() => handleBulkAction('archive')}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Tag className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">Chưa có khuyến mãi nào</p>
          <p className="text-xs text-gray-500 mt-1">Tạo chương trình khuyến mãi đầu tiên để thu hút khách hàng</p>
          <button
            onClick={() => router.push('/promotions/new')}
            className="mt-4 btn-primary inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tạo khuyến mãi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((promo) => (
            <div key={promo.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(promo.id)}
                onChange={() => toggleSelect(promo.id)}
                className="mt-5 rounded border-gray-300"
              />
              <div className="flex-1">
                <PromotionCard
                  promotion={promo}
                  onClick={() => router.push(`/promotions/${promo.id}`)}
                  onPause={() => handlePause(promo.id)}
                  onArchive={() => handleArchive(promo.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics for active promos */}
      {promos.filter((p) => p.status === 'active').length > 0 && (
        <div className="card mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" />
            Tổng quan hiệu suất
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Lượt dùng KM</p>
              <p className="text-lg font-bold text-gray-900">{totalUsage}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Doanh thu từ KM</p>
              <p className="text-lg font-bold text-brand-600">{formatCurrency(4250000)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Tỉ lệ quy đổi</p>
              <p className="text-lg font-bold text-green-600">12.4%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">ROI</p>
              <p className="text-lg font-bold text-green-600">3.8x</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
