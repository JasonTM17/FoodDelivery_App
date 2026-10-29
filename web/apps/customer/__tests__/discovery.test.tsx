import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '@/app/(app)/home/page';

const { get, getPage } = vi.hoisted(() => ({ get: vi.fn(), getPage: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get, getPage } }));
vi.mock('@/components/restaurant-card', () => ({
  RestaurantCard: ({ restaurant }: { restaurant: { name: string } }) => <span>{restaurant.name}</span>,
}));

describe('customer discovery HTTP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads default nearby restaurants on mount without sending an invalid empty query', async () => {
    getPage.mockResolvedValue({
      items: [{ id: 'demo', name: 'Phở 24', rating: 4.5, totalReviews: 50, cuisineTypes: [], isOpen: true }],
      total: 1,
      page: 1,
      limit: 12,
    });
    render(<HomePage />);
    await waitFor(() =>
      expect(getPage).toHaveBeenCalledWith(
        '/restaurants/nearby?lat=10.7769&lng=106.7009&page=1&limit=12&radius=25',
      ),
    );
    expect(await screen.findByText('Phở 24')).toBeInTheDocument();
    expect(screen.queryByText(/Validation failed/)).not.toBeInTheDocument();
  });

  it('renders real search rows and metadata through the paginated adapter', async () => {
    getPage.mockResolvedValue({
      items: [{ id: 'demo', name: 'Phở 24', rating: 4.5, totalReviews: 50, cuisineTypes: [], isOpen: true }],
      total: 25,
      page: 1,
      limit: 12,
    });
    render(<HomePage />);
    await screen.findByText('Phở 24');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Phở' } });
    fireEvent.click(screen.getByRole('button', { name: /^Search$/ }));
    await waitFor(() =>
      expect(getPage).toHaveBeenCalledWith('/restaurants/search?page=1&limit=12&q=Ph%E1%BB%9F'),
    );
    expect(await screen.findByText('Phở 24')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
