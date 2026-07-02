'use client';

import type { ReactNode } from 'react';
import { FileText, Hash, MapPin, Phone, Receipt, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Order } from '@/lib/types';
import { cn, formatCurrency, formatTimeAgo } from '@/lib/utils';

const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  restaurant_pending: 'status.restaurant_pending',
  restaurant_accepted: 'status.restaurant_accepted',
  preparing: 'status.preparing',
  ready_for_pickup: 'status.ready_for_pickup',
  driver_assigned: 'status.driver_assigned',
  picked_up: 'status.picked_up',
  delivering: 'status.delivering',
  delivered: 'status.delivered',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
  refunded: 'status.refunded',
};

export function OrderDetailSkeleton() {
  return (
    <div>
      <div className="mb-6 h-6 w-32 skeleton" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card h-48" />
          <div className="card h-64" />
        </div>
        <div className="space-y-6">
          <div className="card h-48" />
          <div className="card h-48" />
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const t = useTranslations('orderDetail');
  const labelKey = STATUS_TRANSLATION_KEYS[status];
  return (
    <span className={cn(
      'rounded-full px-3 py-1 text-xs font-medium',
      status === 'delivered' || status === 'completed' ? 'bg-green-100 text-green-700'
        : status === 'cancelled' || status === 'refunded' ? 'bg-red-100 text-red-700'
          : 'bg-brand-100 text-brand-700',
    )}>
      {labelKey ? t(labelKey) : status}
    </span>
  );
}

export function OrderItemsCard({ order }: { order: Order }) {
  const t = useTranslations('orderDetail');
  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
        <FileText className="h-4 w-4 text-gray-400" />
        {t('itemsTitle')}
      </h2>
      <div className="divide-y divide-gray-100">
        {order.items.map((item) => (
          <div key={item.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">x{item.quantity}</span>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                {item.options.length > 0 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {item.options.map((option) => (
                      <p key={`${option.name}-${option.value}`} className="text-xs text-gray-500">
                        {option.name}: {option.value}
                        {option.price > 0 && ` (+${formatCurrency(option.price)})`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <span className="ml-4 shrink-0 text-sm font-medium text-gray-700">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-sm text-gray-500">{t('total')}</span>
        <span className="text-lg font-bold text-brand-600">{formatCurrency(order.total)}</span>
      </div>

      {order.note && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="mb-1 text-xs font-medium text-yellow-700">{t('noteLabel')}</p>
          <p className="text-sm text-yellow-800">{order.note}</p>
        </div>
      )}
    </div>
  );
}

export function CustomerInfoCard({ order }: { order: Order }) {
  const t = useTranslations('orderDetail');
  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
        <User className="h-4 w-4 text-gray-400" />
        {t('customerTitle')}
      </h2>
      <div className="space-y-3">
        <InfoRow icon={<User className="h-4 w-4 text-brand-600" />} title={order.customerName} subtitle={t('customerNameLabel')} />
        {order.customerPhone && (
          <InfoRow icon={<Phone className="h-4 w-4 text-blue-600" />} title={order.customerPhone} subtitle={t('phoneLabel')} href={`tel:${order.customerPhone}`} />
        )}
        {order.customerAddress && (
          <InfoRow icon={<MapPin className="h-4 w-4 text-green-600" />} title={order.customerAddress} subtitle={t('addressLabel')} />
        )}
        {order.tableNumber && (
          <InfoRow icon={<Hash className="h-4 w-4 text-purple-600" />} title={t('tableValue', { tableNumber: order.tableNumber })} subtitle={t('tableLabel')} />
        )}
      </div>
    </div>
  );
}

export function OrderMetaCard({ order }: { order: Order }) {
  const t = useTranslations('orderDetail');
  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
        <Receipt className="h-4 w-4 text-gray-400" />
        {t('metaTitle')}
      </h2>
      <div className="space-y-2 text-sm">
        <MetaRow label={t('codeLabel')} value={order.code} />
        <MetaRow label={t('orderedAtLabel')} value={formatTimeAgo(order.createdAt)} />
        <MetaRow label={t('itemCountLabel')} value={String(order.items.reduce((sum, item) => sum + item.quantity, 0))} />
      </div>
    </div>
  );
}

function InfoRow({ icon, title, subtitle, href }: { icon: ReactNode; title: string; subtitle: string; href?: string }) {
  const content = <p className="text-sm font-medium text-gray-900">{title}</p>;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">{icon}</div>
      <div>
        {href ? <a href={href} className="text-sm font-medium text-blue-600 hover:underline">{title}</a> : content}
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}
