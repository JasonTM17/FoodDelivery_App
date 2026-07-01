'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Bell, BellRing, RotateCw } from 'lucide-react';
import { OrderQueueCard } from './order-queue-card';
import { api, getStoredRestaurant } from '@/lib/api';
import { connectToRestaurant, disconnectSocket, playNewOrderSound } from '@/lib/socket';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';

type ColumnId = 'pending' | 'preparing' | 'ready';

const COLUMNS = [
  { id: 'pending' as ColumnId, label: 'Mới', color: 'text-red-600', bgColor: 'bg-red-50', dot: 'bg-red-500' },
  { id: 'preparing' as ColumnId, label: 'Đang chuẩn bị', color: 'text-amber-600', bgColor: 'bg-amber-50', dot: 'bg-amber-500' },
  { id: 'ready' as ColumnId, label: 'Sẵn sàng', color: 'text-green-600', bgColor: 'bg-green-50', dot: 'bg-green-500' },
];

const STATUS_MAP: Record<string, ColumnId> = {
  paid: 'pending',
  restaurant_pending: 'pending',
  restaurant_accepted: 'preparing',
  preparing: 'preparing',
  ready_for_pickup: 'ready',
};

function initSound(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('order_sound_enabled') !== 'false';
}

export function OrderKanbanBoard() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(initSound);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const restaurant = getStoredRestaurant();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<{ orders: Order[] }>('/restaurant/orders');
      setAllOrders(data.orders);
      setError('');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('order_sound_enabled', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!restaurant?.id) return;
    const socket = connectToRestaurant(restaurant.id);

    const handleNew = (order: Order) => {
      setAllOrders((prev) => [order, ...prev]);
      if (soundEnabled) playNewOrderSound();
      setNewOrderIds((prev) => new Set(prev).add(order.id));
      setTimeout(() => {
        setNewOrderIds((prev) => { const n = new Set(prev); n.delete(order.id); return n; });
      }, 5000);
    };

    const handleUpdate = (order: Order) => {
      setAllOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    };

    socket.on('new-order', handleNew);
    socket.on('order-update', handleUpdate);
    return () => {
      socket.off('new-order', handleNew);
      socket.off('order-update', handleUpdate);
      disconnectSocket();
    };
  }, [restaurant?.id, soundEnabled]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Đang tải...' : `${allOrders.length} đơn hàng`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={cn('btn-ghost p-2 rounded-lg', soundEnabled ? 'text-brand-600' : 'text-gray-400')}
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

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchOrders} className="text-sm text-red-600 underline mt-1">Thử lại</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const orders = allOrders.filter((o) => STATUS_MAP[o.status] === col.id);
          return (
            <div key={col.id} className={cn('rounded-xl border border-gray-200', col.bgColor)}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                  <h2 className="font-semibold text-gray-900">{col.label}</h2>
                </div>
                <span className={cn('inline-flex items-center justify-center min-w-6 h-6 rounded-full text-xs font-bold px-2', col.color)}>
                  {isLoading ? '—' : orders.length}
                </span>
              </div>
              <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
                {isLoading ? (
                  [1, 2].map((i) => (
                    <div key={i} className="card space-y-3">
                      <div className="h-5 w-32 skeleton" />
                      <div className="h-4 w-full skeleton" />
                      <div className="h-4 w-3/4 skeleton" />
                    </div>
                  ))
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Chưa có đơn hàng</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <OrderQueueCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
