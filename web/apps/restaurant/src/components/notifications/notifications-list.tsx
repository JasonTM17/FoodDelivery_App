'use client';

import { useState, useEffect } from 'react';
import { Bell, ShoppingBag, MessageSquare, AlertTriangle, Package, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

type NotifType = 'order' | 'message' | 'system' | 'stock';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; label: string }> = {
  order:   { icon: ShoppingBag,    color: 'text-brand-600 bg-brand-100',  label: 'Đơn hàng' },
  message: { icon: MessageSquare, color: 'text-blue-600 bg-blue-100',    label: 'Tin nhắn' },
  system:  { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100',  label: 'Hệ thống' },
  stock:   { icon: Package,       color: 'text-red-600 bg-red-100',      label: 'Tồn kho' },
};

const TABS: { key: NotifType | 'all'; label: string }[] = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'order',   label: 'Đơn hàng' },
  { key: 'message', label: 'Tin nhắn' },
  { key: 'system',  label: 'Hệ thống' },
  { key: 'stock',   label: 'Tồn kho' },
];

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotifType | 'all'>('all');

  useEffect(() => {
    api.get<{ notifications: Notification[] }>('/restaurant/notifications')
      .then((data) => setNotifications(data.notifications))
      .catch(() => {/* silently show empty list on error */})
      .finally(() => setIsLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/restaurant/notifications/read-all');
    } catch {
      // optimistic update already applied; revert not needed
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.patch(`/restaurant/notifications/${id}/read`);
    } catch {
      // optimistic update already applied
    }
  };

  const filtered = activeTab === 'all' ? notifications : notifications.filter((n) => n.type === activeTab);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Vừa xong';
    if (diffH < 24) return `${diffH} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100 mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50 border border-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Bell className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => {
          const count = tab.key === 'all'
            ? notifications.filter((n) => !n.read).length
            : notifications.filter((n) => n.type === tab.key && !n.read).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
            >
              {tab.label}
              {count > 0 && (
                <span className="inline-flex items-center justify-center h-4.5 min-w-[1.1rem] px-1 text-xs font-semibold rounded-full bg-brand-500 text-white leading-none py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Không có thông báo nào</p>
          </div>
        )}
        {filtered.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type];
          const Icon = cfg.icon;
          return (
            <button
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={cn('w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm',
                notif.read ? 'bg-white border-gray-200' : 'bg-brand-50/40 border-brand-100')}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', notif.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900')}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{formatTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{notif.body}</p>
                </div>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
