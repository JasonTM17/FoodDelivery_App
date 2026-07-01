'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { ArrowLeft, FileText, Hash, MapPin, Phone, Receipt, RefreshCw, User } from 'lucide-react';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderDriverChat } from '@/components/orders/order-driver-chat';
import { OrderActions } from '@/components/orders/order-actions';
import { OrderPrepTimePicker } from '@/components/orders/order-prep-time-picker';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { formatCurrency, formatDateTime, formatTimeAgo, cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  restaurant_pending: 'Chờ xác nhận',
  restaurant_accepted: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng lấy món',
  driver_assigned: 'Đã có tài xế',
  picked_up: 'Tài xế đã lấy món',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
  refunded: 'Đã hoàn tiền',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = String(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedPrepTime, setSelectedPrepTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.get<Order>(`/restaurant/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const timelineSteps = useMemo(() => ([
    { status: 'restaurant_pending' as OrderStatus, label: 'Chờ xác nhận', timestamp: order?.status === 'restaurant_pending' ? order.createdAt : null },
    { status: 'restaurant_accepted' as OrderStatus, label: 'Đã xác nhận', timestamp: null },
    { status: 'preparing' as OrderStatus, label: 'Đang chuẩn bị', timestamp: null },
    { status: 'ready_for_pickup' as OrderStatus, label: 'Sẵn sàng lấy món', timestamp: null },
    { status: 'delivering' as OrderStatus, label: 'Đang giao', timestamp: null },
    { status: 'delivered' as OrderStatus, label: 'Đã giao', timestamp: null },
  ]), [order?.createdAt, order?.status]);

  const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await api.patch<Order>(`/restaurant/orders/${orderId}/status`, {
        status: newStatus,
        note: reason,
      });
      setOrder(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Đơn hàng không tồn tại'}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Quay lại
          </button>
          <button type="button" onClick={loadOrder} className="btn-primary">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.push('/orders')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại đơn hàng
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Receipt className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Đơn hàng {order.code}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrderItemsCard order={order} />

          <div className="card">
            <OrderActions status={order.status} onStatusChange={handleStatusChange} isSubmitting={isSubmitting} />
          </div>

          {(order.status === 'restaurant_accepted' || order.status === 'preparing') && (
            <div className="card">
              <OrderPrepTimePicker selected={selectedPrepTime} onSelect={setSelectedPrepTime} />
            </div>
          )}

          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
            <OrderTimeline currentStatus={order.status} steps={timelineSteps} />
          </div>

          {(order.status === 'ready_for_pickup' || order.status === 'delivering') && (
            <OrderDriverChat orderId={order.id} />
          )}
        </div>

        <div className="space-y-6">
          <CustomerInfoCard order={order} />
          <OrderMetaCard order={order} />
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div>
      <div className="h-6 w-32 skeleton mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn(
      'rounded-full px-3 py-1 text-xs font-medium',
      status === 'delivered' || status === 'completed' ? 'bg-green-100 text-green-700'
        : status === 'cancelled' || status === 'refunded' ? 'bg-red-100 text-red-700'
          : 'bg-brand-100 text-brand-700'
    )}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function OrderItemsCard({ order }: { order: Order }) {
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-400" />
        Món đã gọi
      </h2>
      <div className="divide-y divide-gray-100">
        {order.items.map((item) => (
          <div key={item.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex justify-between items-start">
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
              <span className="text-sm font-medium text-gray-700 shrink-0 ml-4">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
        <span className="text-sm text-gray-500">Tổng cộng</span>
        <span className="text-lg font-bold text-brand-600">{formatCurrency(order.total)}</span>
      </div>

      {order.note && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-xs text-yellow-700 font-medium mb-1">Ghi chú:</p>
          <p className="text-sm text-yellow-800">{order.note}</p>
        </div>
      )}
    </div>
  );
}

function CustomerInfoCard({ order }: { order: Order }) {
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-gray-400" />
        Thông tin khách hàng
      </h2>
      <div className="space-y-3">
        <InfoRow icon={<User className="h-4 w-4 text-brand-600" />} title={order.customerName} subtitle="Tên khách hàng" />
        {order.customerPhone && (
          <InfoRow icon={<Phone className="h-4 w-4 text-blue-600" />} title={order.customerPhone} subtitle="Số điện thoại" href={`tel:${order.customerPhone}`} />
        )}
        {order.customerAddress && (
          <InfoRow icon={<MapPin className="h-4 w-4 text-green-600" />} title={order.customerAddress} subtitle="Địa chỉ" />
        )}
        {order.tableNumber && (
          <InfoRow icon={<Hash className="h-4 w-4 text-purple-600" />} title={`Bàn ${order.tableNumber}`} subtitle="Số bàn" />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, title, subtitle, href }: { icon: ReactNode; title: string; subtitle: string; href?: string }) {
  const content = <p className="text-sm font-medium text-gray-900">{title}</p>;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shrink-0">{icon}</div>
      <div>
        {href ? <a href={href} className="text-sm font-medium text-blue-600 hover:underline">{title}</a> : content}
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function OrderMetaCard({ order }: { order: Order }) {
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-gray-400" />
        Thông tin đơn hàng
      </h2>
      <div className="space-y-2 text-sm">
        <MetaRow label="Mã đơn" value={order.code} />
        <MetaRow label="Thời gian đặt" value={formatTimeAgo(order.createdAt)} />
        <MetaRow label="Số món" value={String(order.items.reduce((sum, item) => sum + item.quantity, 0))} />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
