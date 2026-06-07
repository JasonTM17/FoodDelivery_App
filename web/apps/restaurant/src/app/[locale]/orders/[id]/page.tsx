'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Clock,
  User,
  Hash,
  Receipt,
} from 'lucide-react';
import StatusTimeline from '@/components/StatusTimeline';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatCurrency, formatDateTime, formatTimeAgo } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.get<Order>(`/orders/${params.id}`);
        setOrder(data);
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  if (isLoading) {
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

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Đơn hàng không tồn tại'}</p>
        <button onClick={() => router.back()} className="btn-primary">
          Quay lại
        </button>
      </div>
    );
  }

  // Build status history from order data
  const statusHistory: Record<string, string> = {
    [order.status]: order.updatedAt,
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/orders')}
        className="btn-ghost mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại đơn hàng
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Receipt className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Đơn hàng {order.code}</h1>
            <p className="text-sm text-gray-500">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <span className="badge bg-brand-100 text-brand-700 border-brand-200">
          {order.status === 'pending' && 'Chờ xác nhận'}
          {order.status === 'confirmed' && 'Đã xác nhận'}
          {order.status === 'preparing' && 'Đang chuẩn bị'}
          {order.status === 'ready' && 'Sẵn sàng'}
          {order.status === 'delivering' && 'Đang giao'}
          {order.status === 'delivered' && 'Đã giao'}
          {order.status === 'cancelled' && 'Đã hủy'}
          {order.status === 'rejected' && 'Từ chối'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Status Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
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
                        <span className="text-sm font-medium text-gray-900">
                          x{item.quantity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                      {item.options.length > 0 && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {item.options.map((opt, oi) => (
                            <p key={oi} className="text-xs text-gray-500">
                              {opt.name}: {opt.value}
                              {opt.price > 0 && ` (+${formatCurrency(opt.price)})`}
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

            {/* Total */}
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500">Tổng cộng</span>
              <span className="text-lg font-bold text-brand-600">
                {formatCurrency(order.total)}
              </span>
            </div>

            {/* Note */}
            {order.note && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-medium mb-1">Ghi chú:</p>
                <p className="text-sm text-yellow-800">{order.note}</p>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Trạng thái đơn hàng
            </h2>
            <StatusTimeline currentStatus={order.status} statusHistory={statusHistory} />
          </div>
        </div>

        {/* Right: Customer Info */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              Thông tin khách hàng
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 shrink-0">
                  <User className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-500">Tên khách hàng</p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <a href={`tel:${order.customerPhone}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {order.customerPhone}
                    </a>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                  </div>
                </div>
              )}

              {order.customerAddress && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shrink-0">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.customerAddress}</p>
                    <p className="text-xs text-gray-500">Địa chỉ</p>
                  </div>
                </div>
              )}

              {order.tableNumber && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 shrink-0">
                    <Hash className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bàn {order.tableNumber}</p>
                    <p className="text-xs text-gray-500">Số bàn</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order info */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gray-400" />
              Thông tin đơn hàng
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn</span>
                <span className="font-medium text-gray-900">{order.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian đặt</span>
                <span className="text-gray-700">{formatTimeAgo(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số món</span>
                <span className="text-gray-700">{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
