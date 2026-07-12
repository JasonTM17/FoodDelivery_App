import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderStatusActions } from '@/components/orders/order-status-actions';

const patchMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

describe('OrderStatusActions', () => {
  beforeEach(() => {
    patchMock.mockReset();
    refreshMock.mockReset();
  });

  it('disables buttons while a status update is in flight and updates local status', async () => {
    let resolvePatch: (value: unknown) => void = () => {};
    patchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }),
    );

    render(<OrderStatusActions orderId="order-1" status="restaurant_pending" />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    fireEvent.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'reject' })).toBeDisabled();

    resolvePatch({});
    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith('/restaurant/orders/order-1/status', {
        status: 'restaurant_accepted',
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'startCooking' })).toBeInTheDocument();
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
