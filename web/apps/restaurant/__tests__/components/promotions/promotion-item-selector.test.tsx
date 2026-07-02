import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromotionItemSelector } from '@/components/promotions/promotion-item-selector';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      searchPlaceholder: 'Search items...',
      loadError: 'Could not load menu items',
      retry: 'Retry',
      empty: 'No items found',
    };
    return messages[key] ?? key;
  },
}));

describe('PromotionItemSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a retryable API error instead of silently falling back to an empty item list', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([]);

    render(<PromotionItemSelector value={[]} onChange={vi.fn()} />);

    expect(await screen.findByText('network down')).toBeVisible();
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No items found')).toBeVisible();
  });
});
