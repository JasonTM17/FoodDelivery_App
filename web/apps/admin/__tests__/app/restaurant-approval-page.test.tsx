import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from '@/lib/api';
import RestaurantApproveError from '@/app/[locale]/restaurants/[id]/approve/error';
import RestaurantApprovePage from '@/app/[locale]/restaurants/[id]/approve/page';

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('restaurant approval page', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
  });

  it('renders a localized pending status and approves the restaurant', async () => {
    mockedApiGet.mockResolvedValueOnce(makeRestaurant());
    mockedApiPost.mockResolvedValueOnce(undefined);

    renderWithClient(<RestaurantApprovePage params={{ id: 'restaurant-1' }} />);

    expect(await screen.findByText('statusPending')).toBeInTheDocument();
    expect(screen.getAllByText('Pho House')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'approve' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/admin/restaurants/restaurant-1/approve', {});
    });
  });

  it('trims the rejection reason before submitting it', async () => {
    mockedApiGet.mockResolvedValueOnce(makeRestaurant());
    mockedApiPost.mockResolvedValueOnce(undefined);

    renderWithClient(<RestaurantApprovePage params={{ id: 'restaurant-1' }} />);

    fireEvent.change(await screen.findByLabelText('rejectReason'), {
      target: { value: '  Missing business license  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'reject' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/admin/restaurants/restaurant-1/reject', {
        reason: 'Missing business license',
      });
    });
  });

  it('shows localized not-found state when the restaurant API returns empty data', async () => {
    mockedApiGet.mockResolvedValueOnce(null);

    renderWithClient(<RestaurantApprovePage params={{ id: 'missing-restaurant' }} />);

    expect(await screen.findByText('notFound')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute('href', '/restaurants');
  });

  it('shows a safe localized error boundary and lets the user retry', () => {
    const reset = vi.fn();

    render(<RestaurantApproveError error={new Error('internal stack trace')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('errorTitle');
    expect(screen.getByRole('alert')).toHaveTextContent('errorDescription');
    expect(screen.queryByText('internal stack trace')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});

function makeRestaurant() {
  return {
    id: 'restaurant-1',
    name: 'Pho House',
    cuisine: 'Vietnamese',
    address: '1 Market Street',
    owner: {
      name: 'Mai',
      email: 'mai@example.com',
      phone: '0900000000',
    },
    description: 'Neighborhood noodle kitchen',
    submittedAt: '2026-07-01T09:00:00.000Z',
    status: 'pending',
    businessLicense: 'license.pdf',
  };
}
