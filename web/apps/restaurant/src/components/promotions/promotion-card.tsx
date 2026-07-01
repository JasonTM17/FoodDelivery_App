'use client';

import type { Promotion, PromotionStatus } from '@/lib/types';
import { getPromotionStatusLabel, getPromotionStatusColor, getPromotionTypeLabel } from '@/lib/promotion-engine';
import { formatCurrency, cn } from '@/lib/utils';
import { Tag, Users, Calendar, BarChart3 } from 'lucide-react';

interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
  onArchive?: () => void;
  onPause?: () => void;
}

export function PromotionCard({ promotion, onClick, onArchive, onPause }: PromotionCardProps) {
  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      data-testid="promotion-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{promotion.code}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', getPromotionStatusColor(promotion.status))}>
              {getPromotionStatusLabel(promotion.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{promotion.name}</p>
        </div>
        <span className="badge bg-brand-50 text-brand-700 border-brand-200">
          {getPromotionTypeLabel(promotion.type)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(promotion.schedule.validFrom).toLocaleDateString('vi-VN')} - {new Date(promotion.schedule.validUntil).toLocaleDateString('vi-VN')}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{promotion.target.audience}</span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {onPause && promotion.status === 'active' && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onPause(); }} className="btn-ghost text-xs text-yellow-600">Tạm dừng</button>
        )}
        {onArchive && (promotion.status === 'expired' || promotion.status === 'draft') && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onArchive(); }} className="btn-ghost text-xs text-gray-500">Lưu trữ</button>
        )}
      </div>
    </div>
  );
}
