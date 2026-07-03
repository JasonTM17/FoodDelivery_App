import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPatch } from '@/lib/api';
import RestaurantMenuTab from '@/components/restaurants/restaurant-menu-tab';
import RestaurantOverviewTab from '@/components/restaurants/restaurant-overview-tab';
import RestaurantReviewsTab from '@/components/restaurants/restaurant-reviews-tab';

const apiGetMock = vi.mocked(apiGet);
const apiPatchMock = vi.mocked(apiPatch);

function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('restaurant detail tab content', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPatchMock.mockReset();
  });

  it('shows a retryable overview error instead of stale restaurant fallback data', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('overview unavailable'));

    renderWithQueryClient(<RestaurantOverviewTab restaurant={{ id: 'restaurant-1' }} />);

    expect(await screen.findByText('loadErrorTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });

  it('does not invent zero metrics when the overview API omits metrics', async () => {
    apiGetMock.mockResolvedValueOnce({
      description: 'Neighborhood kitchen',
      address: '1 Market Street',
      cuisine: 'Vietnamese',
      owner: { name: 'Mai', email: 'mai@example.com', phone: '0900000000' },
      hours: [],
    });

    renderWithQueryClient(<RestaurantOverviewTab restaurant={{ id: 'restaurant-1' }} />);

    expect(await screen.findByText('generalInfoTitle')).toBeInTheDocument();
    expect(screen.getAllByText('notAvailable')).toHaveLength(4);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('sends the switch value to the canonical menu availability endpoint', async () => {
    apiGetMock.mockResolvedValueOnce({
      categories: [
        {
          category: 'Noodles',
          items: [{ id: 'item-1', name: 'Pho', price: 55000, available: false }],
        },
      ],
    });
    apiPatchMock.mockResolvedValueOnce(undefined);

    renderWithQueryClient(<RestaurantMenuTab restaurantId="restaurant-1" />);

    const availabilitySwitch = await screen.findByRole('switch', { name: 'toggleAvailability' });
    fireEvent.click(availabilitySwitch);

    await waitFor(() => {
      expect(apiPatchMock).toHaveBeenCalledWith('/admin/restaurants/restaurant-1/menu/item-1', {
        available: true,
      });
    });
  });

  it('exposes review ratings and distribution to assistive technology', async () => {
    apiGetMock.mockResolvedValueOnce({
      reviews: [
        {
          id: 'review-1',
          rating: 4,
          comment: 'Fresh and fast',
          userName: 'Lan',
          orderCode: 'FF-100',
          createdAt: '2026-07-01T10:00:00.000Z',
          reply: 'Thank you',
        },
      ],
      averageRating: 4,
      totalReviews: 1,
      ratingDistribution: [{ stars: 4, count: 1 }],
    });

    renderWithQueryClient(<RestaurantReviewsTab restaurantId="restaurant-1" />);

    expect(await screen.findByText('overviewTitle')).toBeInTheDocument();
    expect(screen.getAllByLabelText('ratingLabel')).toHaveLength(2);
    expect(screen.getByLabelText('distributionLabel')).toBeInTheDocument();
    expect(screen.getByText('merchantReply')).toBeInTheDocument();
  });
});
