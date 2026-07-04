import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsChartsClient from '@/app/[locale]/analytics/analytics-charts-client';
import { apiGet } from '@/lib/api';

const mockedApiGet = vi.mocked(apiGet);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('analytics charts', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('renders database-backed retention cohorts instead of a degraded placeholder', async () => {
    mockedApiGet.mockResolvedValueOnce({
      orderStatus: [
        { date: '2026-07-01', pending: 1, confirmed: 1, delivering: 1, completed: 2, cancelled: 0 },
      ],
      topRestaurants: [
        { id: 'restaurant-1', name: 'Bún Bò FoodFlow', rating: 4.8, revenue: 1200000, orderCount: 8 },
      ],
      retention: [
        { date: '2026-07-01', newCustomers: 2, retainedCustomers: 1, retentionRate: 50 },
        { date: '2026-07-02', newCustomers: 3, retainedCustomers: 2, retentionRate: 66.7 },
      ],
    });

    renderWithClient(<AnalyticsChartsClient />);

    expect(await screen.findByText('charts.retentionTitle')).toBeInTheDocument();
    expect(screen.getByText('charts.retentionSummary')).toBeInTheDocument();
    expect(screen.getAllByRole('meter', { name: 'charts.retentionCohortLabel' })).toHaveLength(2);
    expect(screen.queryByText('degraded.retentionTitle')).not.toBeInTheDocument();
  });
});
