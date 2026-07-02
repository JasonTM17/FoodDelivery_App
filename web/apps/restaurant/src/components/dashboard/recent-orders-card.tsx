'use client';

import { ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DashboardOrder } from '@/lib/types';
import { cn, formatCurrency, formatTimeAgo } from '@/lib/utils';

interface RecentOrdersCardProps {
  orders: DashboardOrder[];
  onOpenOrder: (id: string) => void;
  onOpenAll: () => void;
}

export default function RecentOrdersCard({
  orders,
  onOpenOrder,
  onOpenAll,
}: RecentOrdersCardProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="lg:col-span-2 card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-brand-600" />
          {t('recentOrders')}
        </h3>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          {t('viewAll')} <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ShoppingBag className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">{t('noRecentOrders')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onOpenOrder(order.id)}
              className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-gray-400 font-mono w-16 shrink-0">
                  {formatTimeAgo(order.createdAt)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.customerName || order.code}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('itemCount', { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </span>
                <StatusBadge status={order.status} />
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('dashboard.status');
  const map: Record<string, { label: string; cls: string }> = {
    created: { label: t('created'), cls: 'bg-gray-100 text-gray-700' },
    pending_payment: { label: t('pendingPayment'), cls: 'bg-yellow-100 text-yellow-700' },
    paid: { label: t('paid'), cls: 'bg-blue-100 text-blue-700' },
    restaurant_pending: { label: t('restaurantPending'), cls: 'bg-yellow-100 text-yellow-700' },
    restaurant_accepted: { label: t('restaurantAccepted'), cls: 'bg-blue-100 text-blue-700' },
    preparing: { label: t('preparing'), cls: 'bg-purple-100 text-purple-600' },
    ready_for_pickup: { label: t('readyForPickup'), cls: 'bg-brand-100 text-brand-700' },
    driver_assigned: { label: t('driverAssigned'), cls: 'bg-cyan-100 text-cyan-700' },
    picked_up: { label: t('pickedUp'), cls: 'bg-cyan-100 text-cyan-700' },
    delivering: { label: t('delivering'), cls: 'bg-cyan-100 text-cyan-700' },
    delivered: { label: t('delivered'), cls: 'bg-green-100 text-green-700' },
    completed: { label: t('completed'), cls: 'bg-green-100 text-green-700' },
    cancelled: { label: t('cancelled'), cls: 'bg-red-100 text-red-700' },
    refunded: { label: t('refunded'), cls: 'bg-red-100 text-red-700' },
  };
  const info = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', info.cls)}>
      {info.label}
    </span>
  );
}
