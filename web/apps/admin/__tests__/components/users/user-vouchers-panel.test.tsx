import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserVouchersPanel from '@/components/users/user-vouchers-panel';
import { apiGet } from '@/lib/api';

const mockedApiGet = vi.mocked(apiGet);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('UserVouchersPanel', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('renders real voucher wallet data from the admin API contract', async () => {
    mockedApiGet.mockResolvedValueOnce({
      owned: [
        {
          id: 'promo-1',
          promotionId: 'promo-1',
          code: 'SAVE20',
          description: 'Persisted promotion',
          discountType: 'percentage',
          discountValue: 20,
          minOrder: 100_000,
          maxDiscount: 30_000,
          validUntil: '2026-07-31T23:59:59.000Z',
          usedAt: null,
        },
      ],
      used: [
        {
          id: 'usage-1',
          promotionId: 'promo-2',
          code: 'LUNCH15',
          description: 'Persisted usage',
          discountType: 'fixed',
          discountValue: 15_000,
          minOrder: 50_000,
          maxDiscount: 0,
          validUntil: '2026-07-31T23:59:59.000Z',
          usedAt: '2026-07-06T10:00:00.000Z',
          orderCode: 'FD260706ABCD',
        },
      ],
      totalSaved: 15_000,
    });

    renderWithClient(<UserVouchersPanel userId="user-1" />);

    expect(await screen.findByText('SAVE20')).toBeInTheDocument();
    expect(screen.getByText('LUNCH15')).toBeInTheDocument();
    expect(screen.getByText('usedBadge')).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(mockedApiGet).toHaveBeenCalledWith('/admin/users/user-1/vouchers');
  });
});
