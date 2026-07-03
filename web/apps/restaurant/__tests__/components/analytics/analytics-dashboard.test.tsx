import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnalyticsDashboard } from '@/components/restaurant/analytics/analytics-dashboard';
import { api } from '@/lib/api';
import type { RevenueSummary } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      title: 'Analytics',
      description: 'Restaurant performance overview',
      loading: 'Loading analytics',
      retry: 'Retry',
      errorTitle: 'Analytics unavailable',
      errorDescription: 'Could not load analytics.',
      today: 'Today',
      week: 'This week',
      month: 'This month',
      totalOrders: 'Total orders',
      totalOrdersSub: 'Delivered and completed orders',
      totalRevenue: 'Total revenue',
      totalRevenueSub: 'From delivered and completed orders',
      avgOrderValue: 'Avg order value',
      avgOrderValueSub: `Average per day: ${values?.amount ?? ''}`,
      hourlyOrders: 'Orders by hour',
      ordersByHourTable: 'Orders by hour data table',
      hourLabel: `${values?.hour}:00`,
      hourTooltip: `${values?.hour}:00: ${values?.count} orders`,
      byCategory: 'By category',
      categoryRevenueTable: 'Revenue by category data table',
      categoryColumn: 'Category',
      hourColumn: 'Hour',
      ordersColumn: 'Orders',
      revenueColumn: 'Revenue',
      shareColumn: 'Share',
      noData: 'No data yet',
      noCategories: 'No category revenue yet',
    };
    return messages[key] ?? key;
  },
}));

const summary: RevenueSummary = {
  total: { vnd: 2_500_000, orderCount: 12 },
  avg: { orderValue: 208_333, perDay: 357_143 },
  delta: { vsYesterday: null, vsLastWeek: 12.5, vsLastMonth: -3 },
  byDay: [],
  byCategory: [
    { categoryId: 'cat-1', name: 'Noodles', vnd: 1_500_000, pct: 60 },
    { categoryId: 'cat-2', name: 'Drinks', vnd: 1_000_000, pct: 40 },
  ],
  byHour: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    vnd: hour === 12 ? 800_000 : 0,
    orderCount: hour === 12 ? 4 : 0,
  })),
  bySource: [],
  byPayment: [],
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders restaurant revenue summary returned by the real analytics API', async () => {
    vi.mocked(api.get).mockResolvedValue(summary);

    render(<AnalyticsDashboard />);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/restaurant/revenue/summary?days=7'));
    expect(await screen.findByText('12')).toBeVisible();
    expect(screen.getAllByText('Noodles')[0]).toBeVisible();
    expect(screen.getAllByText(/60%/)[0]).toBeVisible();
    expect(screen.queryByText('128')).not.toBeInTheDocument();
  });

  it('shows a retryable error instead of falling back to static analytics', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));

    render(<AnalyticsDashboard />);

    expect(await screen.findByText('Analytics unavailable')).toBeVisible();
    expect(screen.getByRole('button', { name: /retry/i })).toBeVisible();
    expect(screen.queryByText('Noodles')).not.toBeInTheDocument();
    expect(screen.queryByText('12')).not.toBeInTheDocument();
  });
});
