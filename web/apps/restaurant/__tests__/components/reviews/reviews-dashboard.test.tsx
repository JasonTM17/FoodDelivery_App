import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewsDashboard } from '@/components/reviews/reviews-dashboard';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      title: 'Customer Reviews',
      description: 'View and respond to customer reviews',
      loadError: 'Could not load reviews',
      submitError: 'Could not send reply',
      avgRating: 'Average rating',
      totalReviews: 'Total reviews',
      fiveStarRate: '5-star rate',
      responseRate: 'Response rate',
      filterLabel: 'Filter:',
      all: 'All',
      commentOnly: 'With comments only',
      empty: 'No reviews yet',
      restaurantReply: 'Restaurant reply',
      replyPlaceholder: 'Write a reply...',
      sendReplyAria: 'Send review reply',
      ratingAria: `${values?.rating ?? 0} out of 5 stars`,
      starFilterAria: `Filter by ${values?.rating ?? 0} stars`,
      orderBadge: `#${values?.orderId ?? ''}`,
    };
    return messages[key] ?? key;
  },
}));

const review = {
  id: 'review-1',
  customerName: 'An Nguyen',
  customerInitial: 'A',
  rating: 5,
  comment: 'Great pho',
  reply: null,
  createdAt: '2026-07-02T08:00:00.000Z',
  orderId: 'order-1',
};

describe('ReviewsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders zero-value KPIs for an empty real API response', async () => {
    vi.mocked(api.get).mockResolvedValue({ reviews: [] });

    render(<ReviewsDashboard />);

    expect(await screen.findByText('No reviews yet')).toBeVisible();
    expect(screen.getByText('0.0')).toBeVisible();
    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows a contract error instead of treating malformed reviews as an empty list', async () => {
    vi.mocked(api.get).mockResolvedValue({});

    render(<ReviewsDashboard />);

    expect(await screen.findByRole('heading', { name: 'Could not load reviews' })).toBeVisible();
    expect(screen.queryByText('No reviews yet')).not.toBeInTheDocument();
  });

  it('posts a merchant reply and renders the updated review without static fallback data', async () => {
    vi.mocked(api.get).mockResolvedValue({ reviews: [review] });
    vi.mocked(api.post).mockResolvedValue({});

    render(<ReviewsDashboard />);

    expect(await screen.findByText('An Nguyen')).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText('Write a reply...'), {
      target: { value: 'Thanks for visiting!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send review reply' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/restaurant/reviews/review-1/reply', {
        reply: 'Thanks for visiting!',
      });
    });
    expect(await screen.findByText('Thanks for visiting!')).toBeVisible();
    expect(screen.queryByText('128')).not.toBeInTheDocument();
  });
});
