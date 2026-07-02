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
