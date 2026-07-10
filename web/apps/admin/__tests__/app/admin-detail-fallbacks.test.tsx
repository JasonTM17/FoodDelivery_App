import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrdersTableClient from '@/app/[locale]/orders/orders-table-client';
import { parseOrderItems } from '@/app/[locale]/orders/order-detail-contract';
import RestaurantsTableClient from '@/app/[locale]/restaurants/restaurants-table-client';
import { apiGet, apiGetEnvelope } from '@/lib/api';

const mockedApiGet = vi.mocked(apiGet);
const mockedApiGetEnvelope = vi.mocked(apiGetEnvelope);

describe('admin detail sheets', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiGetEnvelope.mockReset();
  });

  it('shows a retryable restaurant detail error instead of stale row data', async () => {
    mockedApiGet.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/admin/restaurants?') || endpoint === '/admin/restaurants') {
        return Promise.resolve({
          restaurants: [makeRestaurant()],
          total: 1,
        });
      }
      if (endpoint === '/admin/restaurants/restaurant-1') {
        return Promise.reject(new Error('detail failed'));
      }
      return Promise.reject(new Error(`unexpected endpoint: ${endpoint}`));
    });

    renderWithQueryClient(<RestaurantsTableClient />);

    expect(await screen.findByText('Row Bistro')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'viewRestaurant' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('errorTitle');
    expect(screen.queryByText('Stale fallback restaurant address')).not.toBeInTheDocument();
  });

  it('shows a retryable order detail error instead of stale row data', async () => {
    mockedApiGetEnvelope.mockResolvedValueOnce({
      data: [makeOrder()],
      meta: { page: 1, limit: 15, total: 1 },
    });
    mockedApiGet.mockRejectedValueOnce(new Error('detail failed'));

    renderWithQueryClient(<OrdersTableClient />);

    expect(await screen.findByText('ORD-STALE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'viewOrder' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('loadError');
    expect(screen.queryByText('Stale fallback delivery address')).not.toBeInTheDocument();
  });

  it('shows an order item contract error instead of rendering a fake empty item list', async () => {
    mockedApiGetEnvelope.mockResolvedValueOnce({
      data: [makeOrder()],
      meta: { page: 1, limit: 15, total: 1 },
    });
    mockedApiGet.mockResolvedValueOnce({
      ...makeOrder(),
      items: undefined,
      deliveryAddress: 'Fresh backend delivery address',
    });

    renderWithQueryClient(<OrdersTableClient />);

    expect(await screen.findByText('ORD-STALE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'viewOrder' }));

    expect(await screen.findByText('itemsUnavailable')).toBeInTheDocument();
    expect(screen.getByText('Fresh backend delivery address', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Stale fallback item')).not.toBeInTheDocument();
  });
});

describe('parseOrderItems', () => {
  it('accepts real backend order item rows', () => {
    expect(parseOrderItems([{ name: 'Pho', quantity: 2, price: 55000 }])).toEqual([
      { name: 'Pho', quantity: 2, price: 55000 },
    ]);
  });

  it('rejects missing or malformed item rows instead of fabricating an empty list', () => {
    expect(parseOrderItems(undefined)).toBeNull();
    expect(parseOrderItems([{ name: '', quantity: 1, price: 55000 }])).toBeNull();
    expect(parseOrderItems([{ name: 'Pho', quantity: 0, price: 55000 }])).toBeNull();
    expect(parseOrderItems([{ name: 'Pho', quantity: 1, price: Number.NaN }])).toBeNull();
  });
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

function makeRestaurant() {
  return {
    id: 'restaurant-1',
    name: 'Row Bistro',
    owner: {
      name: 'Owner One',
      email: 'owner@foodflow.test',
      phone: '0900000000',
    },
    cuisine: 'Vietnamese',
    rating: 4.7,
    totalOrders: 42,
    status: 'active',
    address: 'Stale fallback restaurant address',
    createdAt: '2026-07-02T08:30:00.000Z',
  };
}

function makeOrder() {
  return {
    id: 'order-1',
    orderCode: 'ORD-STALE',
    customer: {
      id: 'customer-1',
      name: 'Customer One',
      phone: '0911111111',
    },
    restaurant: {
      id: 'restaurant-1',
      name: 'Row Bistro',
      address: 'Restaurant list address',
    },
    driver: null,
    status: 'restaurant_pending',
    total: 125_000,
    deliveryFee: 15_000,
    discount: 5_000,
    items: [
      {
        name: 'Stale fallback item',
        quantity: 1,
        price: 115_000,
      },
    ],
    note: '',
    deliveryAddress: 'Stale fallback delivery address',
    createdAt: '2026-07-02T08:30:00.000Z',
    updatedAt: '2026-07-02T08:35:00.000Z',
  };
}
