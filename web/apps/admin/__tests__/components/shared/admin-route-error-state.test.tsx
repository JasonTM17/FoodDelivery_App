import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginError from '@/app/[locale]/login/error';
import OrderDetailError from '@/app/[locale]/orders/[id]/error';
import RestaurantDetailError from '@/app/[locale]/restaurants/[id]/error';
import SettingsBrandingError from '@/app/[locale]/settings/branding/error';
import { AdminRouteErrorState } from '@/components/shared/admin-route-error-state';

describe('AdminRouteErrorState', () => {
  it('renders a retryable alert with an optional back link', () => {
    const reset = vi.fn();

    render(
      <AdminRouteErrorState
        title="Unable to load orders"
        description="Refresh the page or try again."
        retryLabel="Retry"
        reset={reset}
        backHref="/orders"
        backLabel="Back to orders"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load orders');
    expect(screen.getByRole('link', { name: 'Back to orders' })).toHaveAttribute(
      'href',
      '/orders',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('keeps order detail errors localized and hides raw exception text', () => {
    render(<OrderDetailError error={new Error('database stack trace')} reset={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('orderDetail.title');
    expect(screen.getByRole('alert')).toHaveTextContent('genericDescription');
    expect(screen.queryByText('database stack trace')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'backToOrders' })).toHaveAttribute('href', '/orders');
  });

  it('keeps settings subsection errors localized and hides raw exception text', () => {
    render(<SettingsBrandingError error={new Error('secret provider down')} reset={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('settingsBranding.title');
    expect(screen.queryByText('secret provider down')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'backToSettings' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('keeps login and restaurant detail errors from leaking raw exception text', () => {
    const { rerender } = render(<LoginError error={new Error('login stack trace')} reset={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('login.title');
    expect(screen.queryByText('login stack trace')).not.toBeInTheDocument();

    rerender(
      <RestaurantDetailError error={new Error('restaurant stack trace')} reset={vi.fn()} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('restaurantDetail.title');
    expect(screen.queryByText('restaurant stack trace')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'backToRestaurants' })).toHaveAttribute(
      'href',
      '/restaurants',
    );
  });
});
