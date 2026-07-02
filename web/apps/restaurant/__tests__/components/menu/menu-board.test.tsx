import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuBoard } from '@/components/menu/menu-board';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      title: 'Menu',
      addItem: 'Add Item',
      summary: `${values?.items ?? 0} items · ${values?.categories ?? 0} categories`,
      loadError: 'Could not load menu',
      updateError: 'Could not update item status',
      retry: 'Retry',
      searchPlaceholder: 'Search menu items...',
      emptyTitle: 'No menu items yet',
      emptyDescription: 'Add the first item to your menu',
      searchEmpty: `No items match “${values?.query ?? ''}”`,
    };
    return messages[key] ?? key;
  },
}));

describe('MenuBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an honest empty menu state from the real items endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    render(<MenuBoard />);

    expect(await screen.findByText('No menu items yet')).toBeVisible();
    expect(screen.getByText('Add the first item to your menu')).toBeVisible();
    expect(screen.getByText('0 items · 0 categories')).toBeVisible();
    expect(api.get).toHaveBeenCalledWith('/restaurant/menu/items');
  });

  it('shows a retryable load error instead of static fallback menu data', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([]);

    render(<MenuBoard />);

    expect(await screen.findByText('network down')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No menu items yet')).toBeVisible();
    expect(screen.queryByText('Phở')).not.toBeInTheDocument();
  });
});
