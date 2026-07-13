import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestaurantLayoutClient } from '@/components/layout/restaurant-layout-client';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/chatbot/ai-chatbot-widget', () => ({
  AiChatbotWidget: () => null,
}));

vi.mock('@/lib/api', () => ({
  clearToken: vi.fn(),
  getStoredRestaurant: () => ({ name: 'FoodFlow Test Restaurant' }),
}));

describe('Restaurant shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes a skip target and keeps the desktop content offset in sync with the sidebar', () => {
    render(
      <RestaurantLayoutClient>
        <h1>Orders</h1>
      </RestaurantLayoutClient>,
    );

    const main = screen.getByRole('main');
    const contentShell = main.parentElement;
    if (!contentShell) throw new Error('Restaurant main content shell is missing');
    expect(screen.getByRole('link', { name: 'common.skipToMain' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(contentShell).toHaveClass('lg:ml-[260px]', 'motion-reduce:transition-none');

    fireEvent.click(screen.getByRole('button', { name: 'sidebar.collapse' }));

    expect(contentShell).toHaveClass('lg:ml-16');
    expect(screen.getByRole('link', { name: 'nav.orders' })).toHaveAttribute(
      'aria-label',
      'nav.orders',
    );
    expect(screen.getByRole('link', { name: 'nav.overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens a labelled mobile navigation dialog, focuses it, and closes after navigation', async () => {
    render(
      <RestaurantLayoutClient>
        <h1>Orders</h1>
      </RestaurantLayoutClient>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'sidebar.openNavigation' }));

    const navigationDialog = screen.getByRole('dialog', { name: 'sidebar.mobileTitle' });
    expect(navigationDialog).toHaveAccessibleDescription('sidebar.mobileDescription');

    const overviewLink = within(navigationDialog).getByRole('link', { name: 'nav.overview' });
    await waitFor(() => expect(overviewLink).toHaveFocus());

    fireEvent.click(overviewLink);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'sidebar.mobileTitle' })).not.toBeInTheDocument();
    });
  });
});
