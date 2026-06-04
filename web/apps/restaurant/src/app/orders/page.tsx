'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Bell, BellRing, RotateCw } from 'lucide-react';
import OrderCard from '@/components/OrderCard';
import { api, getStoredRestaurant } from '@/lib/api';
import { connectToRestaurant, disconnectSocket, playNewOrderSound } from '@/lib/socket';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';

type ColumnId = 'pending' | 'preparing' | 'ready';

interface Column {
  id: ColumnId;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  headerBg: string;
}

const COLUMNS: Column[] = [
  { id: 'pending', label: 'Mới', count: 0, color: 'text-red-600', bgColor: 'bg-red-50', headerBg: 'bg-red-600' },
  { id: 'preparing', label: 'Đang chuẩn bị', count: 0, color: 'text-yellow-600', bgColor: 'bg-yellow-50', headerBg: 'bg-yellow-500' },
  { id: 'ready', label: 'Sẵn sàng', count: 0, color: 'text-green-600', bgColor: 'bg-green-50', headerBg: 'bg-green-600' },
];

const statusToColumn: Record<string, ColumnId> = {
  pending: 'pending',
  confirmed: 'preparing',
  preparing: 'preparing',
  ready: 'ready',
};

function getOrdersForColumn(orders: Order[], columnId: ColumnId): Order[] {
  return orders.filter((o) => statusToColumn[o.status] === columnId);
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevOrderCountRef = useRef(0);

  const restaurant = getStoredRestaurant();

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    try {
      const data = await api.get<Order[]>(`/orders/restaurant/${restaurant.id}`);
      setAllOrders(data);
      setError('');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.IO real-time
  useEffect(() => {
    if (!restaurant?.id) return;

    const socket = connectToRestaurant(restaurant.id);

    const handleNewOrder = (order: Order) => {
      setAllOrders((prev) => [order, ...prev]);
      if (soundEnabled) {
        playNewOrderSound();
      }
      setNewOrderIds((prev) => new Set(prev).add(order.id));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
      }, 5000);
    };

    const handleOrderUpdate = (order: Order) => {
      setAllOrders((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      );
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-update', handleOrderUpdate);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-update', handleOrderUpdate);
      disconnectSocket();
    };
  }, [restaurant?.id, soundEnabled]);

  const pendingOrders = getOrdersForColumn(allOrders, 'pending');
  const preparingOrders = getOrdersForColumn(allOrders, 'preparing');
  const readyOrders = getOrdersForColumn(allOrders, 'ready');

  const totalOrders = allOrders.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Đang tải...' : `${totalOrders} đơn hàng`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'btn-ghost p-2 rounded-lg',
              soundEnabled ? 'text-brand-600' : 'text-gray-400'
            )}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </button>
          <button onClick={fetchOrders} className="btn-secondary">
            <RotateCw className="h-4 w-4 mr-1.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchOrders} className="text-sm text-red-600 underline mt-1">
            Thử lại
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <div key={col.id} className="rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="p-4 border-b border-gray-200">
                <div className="h-5 w-24 skeleton" />
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card space-y-3">
                    <div className="h-5 w-32 skeleton" />
                    <div className="h-4 w-full skeleton" />
                    <div className="h-4 w-3/4 skeleton" />
                    <div className="h-5 w-24 skeleton" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col, idx) => {
            const orders = [pendingOrders, preparingOrders, readyOrders][idx];
            return (
              <div
                key={col.id}
                className={cn(
                  'rounded-xl border border-gray-200',
                  col.bgColor
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', col.headerBg.replace('bg-', 'bg-'))} />
                    <h2 className="font-semibold text-gray-900">{col.label}</h2>
                  </div>
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-6 h-6 rounded-full text-xs font-bold px-2',
                    col.color,
                    col.bgColor
                  )}>
                    {orders.length}
                  </span>
                </div>

                {/* Orders list */}
                <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Chưa có đơn hàng</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className={cn(
                          newOrderIds.has(order.id) && 'animate-pulse ring-2 ring-brand-400 rounded-xl'
                        )}
                      >
                        <OrderCard order={order} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
