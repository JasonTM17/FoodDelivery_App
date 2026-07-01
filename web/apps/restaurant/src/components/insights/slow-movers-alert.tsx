'use client';

import type { SlowMover } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Package, Tag, Trash2 } from 'lucide-react';

interface SlowMoversAlertProps {
  items: SlowMover[];
}

const RECOMMENDATION_ICONS: Record<string, React.ReactNode> = {
  bundle: <Package className="h-4 w-4" />,
  discount: <Tag className="h-4 w-4" />,
  remove: <Trash2 className="h-4 w-4" />,
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  bundle: 'Gộp combo',
  discount: 'Giảm giá',
  remove: 'Xoá khỏi menu',
};

export function SlowMoversAlert({ items }: SlowMoversAlertProps) {
  if (items.length === 0) {
    return (
      <div className="card text-center py-6">
        <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Không có món bán chậm</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="slow-movers-alert">
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Món bán chậm ({items.length})
      </h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.itemId} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.ordersInPeriod} đơn trong {item.period} ngày · Giảm {item.pctDecline}%
              </p>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs',
              item.recommendation === 'bundle' ? 'bg-blue-50 text-blue-700' :
              item.recommendation === 'discount' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            )}>
              {RECOMMENDATION_ICONS[item.recommendation]}
              {RECOMMENDATION_LABELS[item.recommendation]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
