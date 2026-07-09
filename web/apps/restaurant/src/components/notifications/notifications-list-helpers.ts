import type { ElementType } from 'react';
import { AlertTriangle, MessageSquare, Package, ShoppingBag } from 'lucide-react';

export type NotificationCategory = 'order' | 'message' | 'system' | 'stock';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount?: number;
}

export function parseNotificationsResponse(data: unknown): NotificationsResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('NOTIFICATIONS_CONTRACT_MISMATCH');
  }

  const response = data as Record<string, unknown>;
  if (!Array.isArray(response.notifications)) {
    throw new Error('NOTIFICATIONS_CONTRACT_MISMATCH');
  }

  return {
    notifications: response.notifications.map(parseNotification),
    unreadCount:
      typeof response.unreadCount === 'number' && Number.isFinite(response.unreadCount)
        ? response.unreadCount
        : undefined,
  };
}

function parseNotification(value: unknown): Notification {
  if (!value || typeof value !== 'object') {
    throw new Error('NOTIFICATIONS_CONTRACT_MISMATCH');
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.type !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.body !== 'string' ||
    typeof row.isRead !== 'boolean' ||
    typeof row.createdAt !== 'string'
  ) {
    throw new Error('NOTIFICATIONS_CONTRACT_MISMATCH');
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export const typeConfig: Record<NotificationCategory, { icon: ElementType; color: string }> = {
  order: { icon: ShoppingBag, color: 'bg-brand-100 text-brand-600' },
  message: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
  system: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
  stock: { icon: Package, color: 'bg-red-100 text-red-600' },
};

export const tabs: Array<NotificationCategory | 'all'> = ['all', 'order', 'message', 'system', 'stock'];

export const dateLocales: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
};

export function getCategory(type: string): NotificationCategory {
  if (type.includes('order')) return 'order';
  if (type.includes('message') || type.includes('support') || type.includes('chat')) return 'message';
  if (type.includes('stock') || type.includes('inventory')) return 'stock';
  return 'system';
}
