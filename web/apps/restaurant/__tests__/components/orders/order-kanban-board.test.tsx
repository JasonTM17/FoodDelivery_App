import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderKanbanBoard } from '@/components/orders/order-kanban-board';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  connect: vi.fn(),
  leave: vi.fn(),
  playSound: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
}));

vi.mock('@/lib/api', () => ({
  api: { get: (...args: unknown[]) => mocks.apiGet(...args) },
  getStoredRestaurant: () => ({ id: 'restaurant-1' }),
}));

vi.mock('@/lib/socket', () => ({
  connectToRestaurant: (...args: unknown[]) => mocks.connect(...args),
  leaveRestaurant: (...args: unknown[]) => mocks.leave(...args),
  playNewOrderSound: (...args: unknown[]) => mocks.playSound(...args),
}));

describe('OrderKanbanBoard', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.connect.mockReset();
    mocks.leave.mockReset();
    mocks.playSound.mockReset();
    mocks.apiGet.mockResolvedValue({ orders: [] });
    mocks.connect.mockReturnValue({ emit: vi.fn(), off: vi.fn(), on: vi.fn() });
  });

  it('reserves a stable scroll region while mobile orders load', async () => {
    mocks.apiGet.mockReturnValue(new Promise(() => {}));

    render(<OrderKanbanBoard />);

    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/restaurant/orders'));
    expect(screen.getByText('loading')).toBeInTheDocument();

    for (const column of screen.getAllByRole('region')) {
      expect(column).toHaveClass('h-80', 'md:h-[calc(100vh-280px)]');
    }
  });
});
