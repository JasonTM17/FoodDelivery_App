import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsList } from '@/components/notifications/notifications-list';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      title: 'Notifications',
      loading: 'Loading notifications',
      loadError: 'Could not load notifications',
      retry: 'Retry',
      allRead: 'All caught up',
      unreadCount: `${values?.count ?? 0} unread notifications`,
      markAllRead: 'Mark all read',
      markReadError: 'Could not mark as read',
      justNow: 'just now',
      hoursAgo: `${values?.count ?? 0}h ago`,
      empty: 'No notifications',
      'tabs.all': 'All',
      'tabs.order': 'Orders',
      'tabs.message': 'Messages',
      'tabs.system': 'System',
      'tabs.stock': 'Stock',
    };
    return messages[key] ?? key;
  },
}));

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an honest empty notification state from the real API response', async () => {
    vi.mocked(api.get).mockResolvedValue({ notifications: [], unreadCount: 0 });

    render(<NotificationsList />);

    expect(await screen.findByText('No notifications')).toBeVisible();
    expect(screen.getByText('All caught up')).toBeVisible();
  });

  it('shows a contract error instead of treating malformed notifications as an empty list', async () => {
    vi.mocked(api.get).mockResolvedValue({});

    render(<NotificationsList />);

    expect(await screen.findByText('Could not load notifications')).toBeVisible();
    expect(screen.getByText('NOTIFICATIONS_CONTRACT_MISMATCH')).toBeVisible();
    expect(screen.queryByText('No notifications')).not.toBeInTheDocument();
  });
});
