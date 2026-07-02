'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { NotificationsErrorState, NotificationsLoadingState } from './notifications-feedback-states';
import {
  dateLocales,
  getCategory,
  tabs,
  type Notification,
  type NotificationCategory,
  type NotificationsResponse,
  typeConfig,
} from './notifications-list-helpers';

export function NotificationsList() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const loadNotifications = () => {
    setIsLoading(true);
    setError(null);
    api.get<NotificationsResponse>('/notifications')
      .then(data => setNotifications(data.notifications ?? []))
      .catch((err: Error) => setError(err.message || t('loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  const filtered = useMemo(
    () => activeTab === 'all'
      ? notifications
      : notifications.filter(notification => getCategory(notification.type) === activeTab),
    [activeTab, notifications],
  );

  const markAllRead = async () => {
    const previous = notifications;
    setIsMarkingAll(true);
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch (err: unknown) {
      setNotifications(previous);
      setError((err as { message?: string }).message || t('markReadError'));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    const previous = notifications;
    setMarkingIds(prev => new Set(prev).add(id));
    setNotifications(prev => prev.map(notification => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err: unknown) {
      setNotifications(previous);
      setError((err as { message?: string }).message || t('markReadError'));
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const diffHours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
    if (diffHours < 1) return t('justNow');
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    return date.toLocaleDateString(dateLocales[locale] ?? 'vi-VN');
  };

  if (isLoading) {
    return <NotificationsLoadingState label={t('loading')} />;
  }

  if (error && notifications.length === 0) {
    return (
      <NotificationsErrorState title={t('loadError')} error={error} retryLabel={t('retry')} onRetry={loadNotifications} />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Bell className="h-5 w-5 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('allRead')}
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            disabled={isMarkingAll}
            className="btn-secondary flex items-center gap-1.5"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            {t('markAllRead')}
          </button>
        ) : null}
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map(tab => {
          const count = notifications.filter(notification => (
            !notification.isRead && (tab === 'all' || getCategory(notification.type) === tab)
          )).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {t(`tabs.${tab}`)}
              {count > 0 ? <span className="inline-flex h-4.5 min-w-[1.1rem] items-center justify-center rounded-full bg-brand-500 px-1 py-0.5 text-xs font-semibold leading-none text-white">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card py-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
            <p className="text-sm text-gray-500">{t('empty')}</p>
          </div>
        ) : null}
        {filtered.map((notification) => {
          const category = getCategory(notification.type);
          const config = typeConfig[category];
          const Icon = config.icon;
          return (
            <button
              key={notification.id}
              onClick={() => markRead(notification.id)}
              disabled={markingIds.has(notification.id)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm',
                notification.isRead ? 'border-gray-200 bg-white' : 'border-brand-100 bg-brand-50/40',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', config.color)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', notification.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900')}>
                      {notification.title}
                    </p>
                    <span className="mt-0.5 shrink-0 text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{notification.body}</p>
                </div>
                {!notification.isRead ? <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
