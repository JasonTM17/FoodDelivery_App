import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestaurantLayoutClient } from '@/components/layout/restaurant-layout-client';

const mockedLogout = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/auth-provider', () => ({
  useAuth: () => ({ logout: mockedLogout }),
}));

describe('Restaurant shell', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedLogout.mockReset();
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

  it('closes mobile navigation with Escape and restores focus to the trigger', async () => {
    render(
      <RestaurantLayoutClient>
        <h1>Orders</h1>
      </RestaurantLayoutClient>,
    );

    const menuButton = screen.getByRole('button', { name: 'sidebar.openNavigation' });
    fireEvent.click(menuButton);
    expect(screen.getByRole('dialog', { name: 'sidebar.mobileTitle' })).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'sidebar.mobileTitle' })).not.toBeInTheDocument();
    });
    expect(menuButton).toHaveFocus();
  });

  it('delegates logout to the auth provider', () => {
    render(
      <RestaurantLayoutClient>
        <h1>Orders</h1>
      </RestaurantLayoutClient>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'common.logout' }));

    expect(mockedLogout).toHaveBeenCalledOnce();
  });
});
