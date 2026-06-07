'use client';

import { useState } from 'react';
import { Bell, ShoppingBag, MessageSquare, AlertTriangle, Package, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const MOCK_NOTIFS: Notification[] = [
  { id: '1', type: 'order',   title: 'Đơn hàng mới #ORD-042', body: 'Khách hàng Nguyễn Văn A vừa đặt đơn 185.000đ', read: false, createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', type: 'order',   title: 'Đơn hàng #ORD-041 đã thanh toán', body: 'Đơn hàng đã được xác nhận thanh toán thành công', read: false, createdAt: '2024-01-15T09:15:00Z' },
  { id: '3', type: 'message', title: 'Tin nhắn từ khách hàng', body: 'Trần Thị B: "Cho tôi thêm tương ớt nhé"', read: false, createdAt: '2024-01-15T08:45:00Z' },
  { id: '4', type: 'stock',   title: 'Cảnh báo tồn kho thấp', body: 'Phở bò đặc biệt chỉ còn 3 phần — cần nhập thêm nguyên liệu', read: true, createdAt: '2024-01-14T16:00:00Z' },
  { id: '5', type: 'system',  title: 'Cập nhật hệ thống', body: 'FoodFlow đã cập nhật tính năng quản lý bàn mới', read: true, createdAt: '2024-01-14T10:00:00Z' },
  { id: '6', type: 'order',   title: 'Đánh giá mới từ khách', body: 'Lê Văn C đã để lại đánh giá 5 sao cho đơn #ORD-039', read: true, createdAt: '2024-01-13T20:30:00Z' },
];

const TABS: { key: NotifType | 'all'; label: string }[] = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'order',   label: 'Đơn hàng' },
  { key: 'message', label: 'Tin nhắn' },
  { key: 'system',  label: 'Hệ thống' },
  { key: 'stock',   label: 'Tồn kho' },
];

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFS);
  const [activeTab, setActiveTab] = useState<NotifType | 'all'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
