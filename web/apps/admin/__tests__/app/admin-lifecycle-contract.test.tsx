import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersTableClient, {
  normalizeUsersResponse,
} from '@/app/[locale]/users/users-table-client';
import RestaurantsTableClient, {
  normalizeRestaurantsResponse,
} from '@/app/[locale]/restaurants/restaurants-table-client';
import { apiGet, apiPatch } from '@/lib/api';

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);

describe('admin lifecycle API contract', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPatch.mockReset();
  });

  it('normalizes admin users from the backend isActive/meta contract', () => {
    expect(
      normalizeUsersResponse({
        users: [
          {
            id: 'user-1',
            fullName: 'Restaurant Owner',
            email: 'owner@foodflow.test',
            phone: null,
            role: 'restaurant',
            isActive: false,
            createdAt: '2026-07-01T00:00:00.000Z',
          },
        ],
        meta: { page: 2, limit: 15, total: 31, totalPages: 3 },
      }),
    ).toMatchObject({
      users: [
        {
          id: 'user-1',
          name: 'Restaurant Owner',
          role: 'restaurant',
          status: 'banned',
        },
      ],
      page: 2,
      total: 31,
      totalPages: 3,
    });
  });

  it('patches user status with isActive instead of legacy status strings', async () => {
    mockedApiGet.mockResolvedValueOnce({
      users: [
        {
          id: 'user-1',
          fullName: 'Driver One',
          email: 'driver@foodflow.test',
          phone: '0900000000',
          role: 'driver',
          isActive: true,
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
    });
    mockedApiPatch.mockResolvedValueOnce({});

    renderWithQueryClient(<UsersTableClient />);

    fireEvent.click(await screen.findByRole('switch', { name: 'toggleStatus' }));

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/admin/users/user-1/status', {
        isActive: false,
      });
    });
  });

  it('normalizes admin restaurants from the backend isActive/meta contract', () => {
    expect(
      normalizeRestaurantsResponse({
        restaurants: [
          {
            id: 'restaurant-1',
            name: 'Pho House',
            cuisineTypes: ['Vietnamese', 'Noodles'],
            rating: '4.8',
            totalOrders: null,
            isActive: true,
            addressLine: '1 Market Street',
            createdAt: '2026-07-01T00:00:00.000Z',
            profiles: [
              {
                user: {
                  fullName: 'Owner One',
                  email: 'owner@foodflow.test',
                  phone: '0900000000',
                },
              },
            ],
          },
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    ).toMatchObject({
      restaurants: [
        {
          id: 'restaurant-1',
          cuisine: 'Vietnamese, Noodles',
          owner: { name: 'Owner One' },
          rating: 4.8,
          status: 'active',
          address: '1 Market Street',
        },
      ],
      total: 1,
    });
  });

  it('patches restaurant status with isActive instead of legacy status strings', async () => {
    mockedApiGet.mockResolvedValueOnce({
      restaurants: [
        {
          id: 'restaurant-1',
          name: 'Pho House',
          cuisineTypes: ['Vietnamese'],
          rating: 4.8,
          totalOrders: 12,
          isActive: true,
          addressLine: '1 Market Street',
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    mockedApiPatch.mockResolvedValueOnce({});

    renderWithQueryClient(<RestaurantsTableClient />);

    fireEvent.click(await screen.findByRole('switch', { name: 'toggleStatus' }));

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/admin/restaurants/restaurant-1/status', {
        isActive: false,
      });
    });
  });
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
