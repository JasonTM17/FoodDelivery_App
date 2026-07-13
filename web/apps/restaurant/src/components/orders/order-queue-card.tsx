'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Clock, User, ChevronRight, AlertCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatCurrency, formatTimeAgo, cn } from '@/lib/utils';
import { OrderStatusActions } from './order-status-actions';

interface OrderQueueCardProps {
  order: Order;
  isNew?: boolean;
}

export function OrderQueueCard({ order, isNew }: OrderQueueCardProps) {
  const router = useRouter();
  const t = useTranslations('orders.queueCard');
  const locale = useLocale();
  const isPending = order.status === 'restaurant_pending';

  return (
    <div
      className={cn(
        'card cursor-pointer transition-[background-color,box-shadow] duration-200 hover:shadow-md group motion-reduce:transition-none',
        isPending && 'bg-red-50/30 ring-2 ring-red-200',
        isNew && 'ring-2 ring-brand-400',
      )}
      onClick={() => router.push(`/orders/${order.id}`)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{order.code}</span>
          {isPending && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-700">
              <AlertCircle className="h-3 w-3" />
              {t('newBadge')}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
      </div>

      <div className="mb-3 space-y-1">
        {order.items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="truncate text-gray-600">
              <span className="mr-1 text-gray-600">x{item.quantity}</span>
              {item.name}
            </span>
            <span className="ml-2 shrink-0 text-gray-700">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
        {order.items.length > 4 && (
          <p className="text-xs text-gray-600">{t('moreItems', { count: order.items.length - 4 })}</p>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between border-t border-dashed border-gray-200 py-2">
        <span className="text-sm font-semibold text-gray-900">{t('total')}</span>
        <span className="text-base font-bold text-brand-600">{formatCurrency(order.total)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {order.customerName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(order.createdAt, locale, t('unknownTime'))}
          </span>
        </div>
        {order.tableNumber && (
          <span className="font-medium text-gray-700">{t('table', { tableNumber: order.tableNumber })}</span>
        )}
      </div>

      <OrderStatusActions orderId={order.id} status={order.status} />
    </div>
  );
}
