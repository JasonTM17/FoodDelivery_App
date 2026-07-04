import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PromotionFunnelClient from '@/app/[locale]/promotions/[id]/promotion-funnel-client';
import OverviewHeatmap from '@/app/[locale]/overview/overview-heatmap';
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

describe('admin promotion and heatmap API contracts', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders promotion analytics from the backend contract without synthetic funnel fields', async () => {
    mockedApiGet.mockResolvedValueOnce({
      redemptions: 7,
      gmv: 1_200_000,
      discountCost: 200_000,
      roi: 5,
    });

    renderWithClient(<PromotionFunnelClient promotionId="promo-1" />);

    expect(await screen.findByText('usageStats')).toBeInTheDocument();
    expect(screen.getByText('used')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('roiDiscountCost')).toBeInTheDocument();
    expect(screen.getByText('roiRevenue')).toBeInTheDocument();
    expect(screen.queryByText('funnelImpressions')).not.toBeInTheDocument();
    expect(screen.queryByText('fraudFlags')).not.toBeInTheDocument();
    expect(mockedApiGet).toHaveBeenCalledWith('/admin/promotions/promo-1/analytics');
  });

  it('requests dispatch heatmap with a real ISO timestamp for the last-hour window', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-04T12:00:00.000Z').getTime());
    mockedApiGet.mockResolvedValueOnce([]);

    renderWithClient(<OverviewHeatmap />);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/admin/dispatch/heatmap', {
        params: { since: '2026-07-04T11:00:00.000Z' },
      });
    });
  });
});
